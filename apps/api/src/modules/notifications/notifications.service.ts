import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { localTime, pushDecision, REMINDER_TYPES } from './push-policy';
import { PushService } from './push.service';

export type NotificationType = 'new_match' | 'new_message' | 'daily_set_ready' | 'nearby_alert' | 'open_ending' | 'report_update' | 'message_request' | 'verification_result' | 'soul_check';

type PushLocale = 'en' | 'ru';

const PUSH_TEXT: Record<NotificationType, Record<PushLocale, { title: string; body: string }>> = {
  new_match: {
    en: { title: 'It’s a match! 🎉', body: 'Open NearSoul to say hi.' },
    ru: { title: 'Это взаимно! 🎉', body: 'Откройте NearSoul и поздоровайтесь.' },
  },
  new_message: {
    en: { title: 'NearSoul', body: 'You have a new message' },
    ru: { title: 'NearSoul', body: 'У вас новое сообщение' },
  },
  daily_set_ready: {
    en: { title: 'NearSoul', body: 'Your Today’s Souls are ready ✨' },
    ru: { title: 'NearSoul', body: 'Ваши «Души дня» готовы ✨' },
  },
  nearby_alert: {
    en: { title: 'Someone compatible is nearby ✨', body: 'Open NearSoul to see who.' },
    ru: { title: 'Рядом кто-то совместимый ✨', body: 'Откройте NearSoul, чтобы узнать, кто это.' },
  },
  open_ending: {
    en: { title: 'NearSoul', body: 'Your Open to meet window ends in 10 minutes.' },
    ru: { title: 'NearSoul', body: 'Режим «Открыт к встрече» закончится через 10 минут.' },
  },
  report_update: {
    en: { title: 'NearSoul', body: 'There’s an update on your report.' },
    ru: { title: 'NearSoul', body: 'По вашей жалобе есть новости.' },
  },
  message_request: {
    en: { title: 'NearSoul', body: 'Someone wrote to you first ✉️' },
    ru: { title: 'NearSoul', body: 'Тебе написали первыми ✉️' },
  },
  soul_check: {
    en: { title: 'NearSoul', body: 'Someone checked your compatibility 💫' },
    ru: { title: 'NearSoul', body: 'Кто-то проверил совместимость с тобой 💫' },
  },
  verification_result: {
    en: { title: 'NearSoul', body: 'Your photo check is done.' },
    ru: { title: 'NearSoul', body: 'Проверка фото завершена.' },
  },
};

/** Generic, lock-screen-safe push text (NOTIF-001). */
export function pushText(type: NotificationType, locale: string): { title: string; body: string } {
  return PUSH_TEXT[type][locale === 'ru' ? 'ru' : 'en'];
}

/** In-app notification centre (PLAT-006, NOTIF-001) + realtime + push. Payloads carry ids, never private content. */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly rt: RealtimeGateway, private readonly push: PushService) {}

  async notify(userId: string, type: NotificationType, payload: Record<string, string>, opts: { push?: boolean; bodyOverride?: string } = {}) {
    const n = await this.prisma.notification.create({ data: { userId, type, payload: payload as Prisma.InputJsonValue } });
    this.rt.emit(userId, 'notification.new', { id: n.id, type, payload, createdAt: n.createdAt });
    if (opts.push !== false) {
      if (await this.mayPush(userId, type)) {
        const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
        const text = pushText(type, u?.locale ?? 'en');
        this.push.send(userId, { title: text.title, body: opts.bodyOverride ?? text.body, data: { type, ...payload } });
      }
    }
    return n;
  }

  /** Per-type toggles, quiet hours and the 1-per-day reminder cap (NOTIF-001, §5.8). */
  private async mayPush(userId: string, type: NotificationType, now = new Date()): Promise<boolean> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { notifyPrefs: true, timezone: true, lastReminderPushDay: true } });
    if (!u || pushDecision(type, u, now) !== 'send') return false;
    if (!REMINDER_TYPES.has(type)) return true;
    // Claim today's reminder slot atomically so two reminders at once can't both go out.
    const today = localTime(now, u.timezone).date;
    const claimed = await this.prisma.user.updateMany({
      where: { id: userId, OR: [{ lastReminderPushDay: null }, { lastReminderPushDay: { not: today } }] },
      data: { lastReminderPushDay: today },
    });
    return claimed.count === 1;
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
