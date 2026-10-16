import { AnalyticsService } from '../analytics/analytics.service';
import { Injectable } from '@nestjs/common';
import { AppError, badRequest, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { containsContactInfo } from '../profile/text-safety';

const NEW_ACCOUNT_MS = 48 * 3_600_000;
export const MAX_MESSAGE = 1000;

/** LIKE-003/004, CHAT-001: participant-only access on every call. */
@Injectable()
export class ChatService {
  /** Alpha demo profiles auto-reply once (ALPHA-002); set by DemoService. */
  onMessageToDemo: ((matchId: string, demoId: string) => Promise<void>) | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: RateLimiter,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly rt: RealtimeGateway,
    private readonly analytics: AnalyticsService,
  ) {}

  /** Returns the active match if `userId` participates, else 404 (never 403: no information leak). */
  async participantMatch(userId: string, matchId: string, opts: { allowEnded?: boolean } = {}) {
    const m = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!m || (m.userLow !== userId && m.userHigh !== userId) || (m.endedAt && !opts.allowEnded)) throw notFound();
    return { match: m, otherId: m.userLow === userId ? m.userHigh : m.userLow };
  }

  async list(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: { endedAt: null, OR: [{ userLow: userId }, { userHigh: userId }] },
      orderBy: { createdAt: 'desc' },
    });
    const otherIds = matches.map((m) => (m.userLow === userId ? m.userHigh : m.userLow));
    const users = await this.prisma.user.findMany({
      where: { id: { in: otherIds } },
      include: { profile: true, soulProfile: { select: { archetype: true } }, photos: { where: { status: 'ready' }, orderBy: { position: 'asc' }, take: 1 } },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const items = await Promise.all(matches.map(async (m) => {
      const otherId = m.userLow === userId ? m.userHigh : m.userLow;
      const u = byId.get(otherId);
      const [last, unread] = await Promise.all([
        this.prisma.message.findFirst({ where: { matchId: m.id, hiddenAt: null }, orderBy: { createdAt: 'desc' } }),
        this.prisma.message.count({ where: { matchId: m.id, senderId: otherId, readAt: null, hiddenAt: null } }),
      ]);
      const deleted = !u || u.status === 'deleted' || u.status === 'deletion_requested';
      return {
        matchId: m.id,
        createdAt: m.createdAt,
        nearby: m.source === 'nearby',
        user: {
          id: otherId,
          firstName: deleted ? null : u?.profile?.firstName ?? null,
          deleted,
          isDemo: !!u?.isDemo,
          archetype: u?.soulProfile?.archetype ?? null,
          photo: !deleted && u?.photos[0] ? await this.storage.signedUrl(u.photos[0].storageKey) : null,
        },
        lastMessage: last ? { body: last.body, fromMe: last.senderId === userId, createdAt: last.createdAt } : null,
        unread,
      };
    }));
    // Conversations by last activity; new matches (no messages) first in their own row on the client.
    return items.sort((x, y) => (y.lastMessage?.createdAt ?? y.createdAt).getTime() - (x.lastMessage?.createdAt ?? x.createdAt).getTime());
  }

  async messages(userId: string, matchId: string, cursor?: string) {
    const { match, otherId } = await this.participantMatch(userId, matchId, { allowEnded: true });
    const rows = await this.prisma.message.findMany({
      where: { matchId, hiddenAt: null, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const other = await this.prisma.user.findUnique({ where: { id: otherId }, select: { readReceipts: true } });
    const first = await this.prisma.message.findMany({ where: { matchId }, orderBy: { createdAt: 'asc' }, take: 3, select: { id: true } });
    const firstIds = new Set(first.map((f) => f.id));
    return {
      ended: !!match.endedAt,
      items: rows.reverse().map((r) => ({
        id: r.id,
        clientMessageId: r.clientMessageId,
        body: r.body,
        fromMe: r.senderId === userId,
        createdAt: r.createdAt,
        read: r.senderId === userId ? (other?.readReceipts ? !!r.readAt : null) : !!r.readAt,
        // CHAT-001: gentle safety tip for links/phones early in a conversation (receiver side only).
        safetyTip: r.senderId !== userId && firstIds.has(r.id) && containsContactInfo(r.body),
      })),
      nextCursor: rows.length === 50 ? rows[0]!.createdAt.toISOString() : null,
    };
  }

  async send(userId: string, matchId: string, clientMessageId: string, rawBody: string) {
    const body = rawBody.trim();
    if (!body) throw badRequest('EMPTY_MESSAGE', 'Message is empty.');
    if (body.length > MAX_MESSAGE) throw badRequest('MESSAGE_TOO_LONG', `Messages can be up to ${MAX_MESSAGE} characters.`);
    const existing = await this.prisma.message.findUnique({ where: { senderId_clientMessageId: { senderId: userId, clientMessageId } } });
    if (existing) {
      if (existing.matchId !== matchId) throw notFound();
      return this.view(existing, userId);
    }
    const { otherId } = await this.participantMatch(userId, matchId);
    const blocked = await this.prisma.block.findFirst({ where: { OR: [{ blockerId: userId, blockedId: otherId }, { blockerId: otherId, blockedId: userId }] } });
    if (blocked) throw notFound();
    this.limiter.check(`msg:${userId}:${matchId}`, 30, 60_000);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } });
    if (Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_MS) {
      const today = await this.prisma.message.count({ where: { senderId: userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
      if (today >= 300) throw new AppError(429, 'MESSAGE_LIMIT', 'You’ve sent a lot of messages today. Please try again tomorrow.');
    }
    const msg = await this.prisma.message.create({ data: { matchId, senderId: userId, clientMessageId, body } });
    await this.trackOutcome(matchId, userId);
    this.rt.emit(otherId, 'message.new', { matchId, message: this.viewFor(msg, otherId) });
    this.rt.emit(userId, 'message.new', { matchId, message: this.viewFor(msg, userId) });
    await this.notifications.notify(otherId, 'new_message', { matchId }, { push: true });
    const other = await this.prisma.user.findUnique({ where: { id: otherId }, select: { isDemo: true } });
    if (other?.isDemo && this.onMessageToDemo) await this.onMessageToDemo(matchId, otherId);
    return this.view(msg, userId);
  }

  async markRead(userId: string, matchId: string) {
    const { otherId } = await this.participantMatch(userId, matchId);
    const { count } = await this.prisma.message.updateMany({ where: { matchId, senderId: otherId, readAt: null }, data: { readAt: new Date() } });
    const me = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { readReceipts: true } });
    if (count && me.readReceipts) this.rt.emit(otherId, 'message.read', { matchId });
  }

  async unmatch(userId: string, matchId: string, reason: 'unmatch' | 'block' = 'unmatch') {
    const { match, otherId } = await this.participantMatch(userId, matchId);
    await this.prisma.$transaction([
      this.prisma.match.update({ where: { id: match.id }, data: { endedAt: new Date(), endedBy: userId, endReason: reason } }),
      this.prisma.message.updateMany({ where: { matchId, hiddenAt: null }, data: { hiddenAt: new Date() } }),
      this.prisma.report.deleteMany({ where: { matchId } }),
    ]);
    for (const id of [userId, otherId]) this.rt.emit(id, 'match.ended', { matchId });
  }

  private async trackOutcome(matchId: string, senderId: string) {
    const m = await this.prisma.match.findUniqueOrThrow({ where: { id: matchId } });
    const p = { userLow: m.userLow, userHigh: m.userHigh };
    const outcome = await this.prisma.pairOutcome.findUnique({ where: { userLow_userHigh: p } });
    if (!outcome) return;
    if (!outcome.firstMsgAt) {
      await this.prisma.pairOutcome.update({ where: { userLow_userHigh: p }, data: { firstMsgAt: new Date() } });
      this.analytics.track(senderId, 'first_message_sent', { tier: outcome.tier });
    }
    if (!outcome.tenMsgsAt) {
      const counts = await this.prisma.message.groupBy({ by: ['senderId'], where: { matchId }, _count: true });
      if (counts.length === 2 && counts.every((c) => c._count >= 10)) {
        await this.prisma.pairOutcome.update({ where: { userLow_userHigh: p }, data: { tenMsgsAt: new Date() } });
        this.analytics.track(m.userLow, 'conversation_reached_10_messages', { tier: outcome.tier });
        this.analytics.track(m.userHigh, 'conversation_reached_10_messages', { tier: outcome.tier });
      }
    }
  }

  private view(m: { id: string; clientMessageId: string; body: string; senderId: string; createdAt: Date; readAt: Date | null }, viewerId: string) {
    return this.viewFor(m, viewerId);
  }

  private viewFor(m: { id: string; clientMessageId: string; body: string; senderId: string; createdAt: Date; readAt: Date | null }, viewerId: string) {
    return { id: m.id, clientMessageId: m.clientMessageId, body: m.body, fromMe: m.senderId === viewerId, createdAt: m.createdAt, read: !!m.readAt, safetyTip: false };
  }
}
