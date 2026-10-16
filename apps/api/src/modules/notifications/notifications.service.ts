import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PushService } from './push.service';

export type NotificationType = 'new_match' | 'new_message' | 'daily_set_ready' | 'nearby_alert' | 'open_ending' | 'report_update';

const PUSH_TEXT: Record<NotificationType, { title: string; body: string }> = {
  new_match: { title: 'It’s a match! 🎉', body: 'Open NearSoul to say hi.' },
  new_message: { title: 'NearSoul', body: 'You have a new message' },
  daily_set_ready: { title: 'NearSoul', body: 'Your Today’s Souls are ready ✨' },
  nearby_alert: { title: 'Someone compatible is nearby ✨', body: 'Open NearSoul to see who.' },
  open_ending: { title: 'NearSoul', body: 'Your Open to meet window ends in 10 minutes.' },
  report_update: { title: 'NearSoul', body: 'There’s an update on your report.' },
};

/** In-app notification centre (PLAT-006, NOTIF-001) + realtime + push. Payloads carry ids, never private content. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly rt: RealtimeGateway, private readonly push: PushService) {}

  async notify(userId: string, type: NotificationType, payload: Record<string, string>, opts: { push?: boolean; bodyOverride?: string } = {}) {
    const n = await this.prisma.notification.create({ data: { userId, type, payload: payload as Prisma.InputJsonValue } });
    this.rt.emit(userId, 'notification.new', { id: n.id, type, payload, createdAt: n.createdAt });
    if (opts.push !== false) {
      const text = PUSH_TEXT[type];
      await this.push.send(userId, { title: text.title, body: opts.bodyOverride ?? text.body, data: { type, ...payload } });
    }
    return n;
  }

  async list(userId: string, cursor?: string) {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return {
      unread,
      items: rows.map((r) => ({ id: r.id, type: r.type, payload: r.payload, read: !!r.readAt, createdAt: r.createdAt })),
      nextCursor: rows.length === 50 ? rows[rows.length - 1]!.createdAt.toISOString() : null,
    };
  }

  async markRead(userId: string, id?: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null, ...(id ? { id } : {}) }, data: { readAt: new Date() } });
  }
}
