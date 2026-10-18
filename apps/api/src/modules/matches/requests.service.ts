import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppError, badRequest, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { env } from '../../config/env';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { containsContactInfo } from '../profile/text-safety';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MAX_MESSAGE } from './chat.service';
import { LikesService } from './likes.service';

export const REQUESTS_PER_DAY = 5;

/**
 * VIP "message first" (CR-26). The message waits as a request; nothing is shared until the recipient accepts, which
 * creates the match with that message as the first one. The recipient's preferences, blocks and safety rules apply.
 */
@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly likes: LikesService,
    private readonly billing: BillingService,
    private readonly notifications: NotificationsService,
    private readonly rt: RealtimeGateway,
  ) {}

  async send(fromId: string, toId: string, rawBody: string) {
    if (!(await this.billing.features(fromId)).messageFirst) throw new AppError(402, 'UPGRADE_REQUIRED', 'Writing first is part of VIP.', { feature: 'messageFirst' });
    const body = rawBody.trim();
    if (!body) throw badRequest('EMPTY_MESSAGE', 'Message is empty.');
    if (body.length > MAX_MESSAGE) throw badRequest('MESSAGE_TOO_LONG', `Messages can be up to ${MAX_MESSAGE} characters.`);
    if (containsContactInfo(body)) throw badRequest('CONTACT_INFO', 'Please keep contact details for later, once you’ve matched.');
    await this.likes.assertCanApproach(fromId, toId, 'profile');
    const existing = await this.prisma.messageRequest.findUnique({ where: { fromId_toId: { fromId, toId } } });
    if (existing) throw new AppError(409, 'REQUEST_EXISTS', 'You’ve already written to this person.');
    const today = await this.prisma.messageRequest.count({ where: { fromId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (today >= REQUESTS_PER_DAY) throw new AppError(429, 'REQUEST_LIMIT', `You can write first to ${REQUESTS_PER_DAY} people a day.`, { limit: REQUESTS_PER_DAY });
    const req = await this.prisma.messageRequest.create({ data: { fromId, toId, body } });
    // Writing first also counts as a like, so a like back from the other side matches as usual.
    await this.prisma.like.upsert({ where: { actorId_targetId: { actorId: fromId, targetId: toId } }, create: { actorId: fromId, targetId: toId, action: 'like', source: 'profile' }, update: { action: 'like' } });
    const to = await this.prisma.user.findUnique({ where: { id: toId }, select: { isDemo: true } });
    if (to?.isDemo && ['alpha', 'development', 'test'].includes(env().APP_ENV)) {
      // Alpha: demo profiles accept so the whole flow can be tried.
      return { id: req.id, status: 'accepted', match: await this.accept(toId, req.id) };
    }
    await this.notifications.notify(toId, 'message_request', { requestId: req.id });
    this.rt.emit(toId, 'request.new', { requestId: req.id });
    return { id: req.id, status: 'pending', match: null };
  }

  async incoming(userId: string) {
    const rows = await this.prisma.messageRequest.findMany({
      where: { toId: userId, status: 'pending', from: { status: 'active', hiddenByModeration: false } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { from: { select: { id: true, dob: true, profile: { select: { firstName: true } }, photos: { where: { status: 'ready' }, orderBy: { position: 'asc' }, take: 1, select: { id: true } } } } },
    });
    return rows.map((r) => ({ id: r.id, fromId: r.fromId, firstName: r.from.profile?.firstName ?? '', body: r.body, createdAt: r.createdAt }));
  }

  async accept(userId: string, requestId: string) {
    const req = await this.prisma.messageRequest.findUnique({ where: { id: requestId } });
    if (!req || req.toId !== userId || req.status !== 'pending') throw notFound();
    const blocked = await this.prisma.block.findFirst({ where: { OR: [{ blockerId: req.fromId, blockedId: req.toId }, { blockerId: req.toId, blockedId: req.fromId }] } });
    if (blocked) throw notFound();
    const match = await this.likes.createMatch(req.fromId, req.toId, 'profile');
    await this.prisma.message.create({ data: { matchId: match.id, senderId: req.fromId, clientMessageId: randomUUID(), body: req.body, createdAt: req.createdAt } });
    await this.prisma.messageRequest.update({ where: { id: req.id }, data: { status: 'accepted', matchId: match.id, respondedAt: new Date() } });
    return match;
  }

  async decline(userId: string, requestId: string) {
    const res = await this.prisma.messageRequest.updateMany({ where: { id: requestId, toId: userId, status: 'pending' }, data: { status: 'declined', respondedAt: new Date() } });
    if (!res.count) throw notFound();
  }
}
