import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';
import { ChatService } from '../matches/chat.service';
import { LikesService } from '../matches/likes.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export const DEMO_REPLY = {
  en: 'Hi! I’m a demo profile, so I can’t really chat. Match with a real tester to try the full experience 🙂',
  ru: 'Привет! Я демо-профиль и не могу по-настоящему переписываться. Найди реального тестера, чтобы попробовать всё целиком 🙂',
};

export const demoAllowed = () => ['alpha', 'development', 'test'].includes(env().APP_ENV);

/** ALPHA-002: demo profiles like back by compatibility and reply once. Impossible in production. */
@Injectable()
export class DemoService implements OnModuleInit {
  private readonly logger = new Logger('Demo');

  constructor(
    private readonly prisma: PrismaService,
    private readonly likes: LikesService,
    private readonly chat: ChatService,
    private readonly rt: RealtimeGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!demoAllowed()) {
      const demos = await this.prisma.user.count({ where: { isDemo: true } });
      if (demos > 0) throw new Error(`Refusing to start: ${demos} demo profiles exist in ${env().APP_ENV}`);
      return;
    }
    this.likes.onLikedDemo = (actor, demo, score) => this.likeBack(actor, demo, score);
    this.chat.onMessageToDemo = (matchId, demo) => this.replyOnce(matchId, demo);
  }

  /** Probability by compatibility: score ≥ 55 → 60%, else 15%. Tests can force it. */
  forceLikeBack: boolean | null = null;

  async likeBack(actorId: string, demoId: string, score: number) {
    const yes = this.forceLikeBack ?? randomInt(0, 100) < (score >= 55 ? 60 : 15);
    if (!yes) return;
    await this.prisma.like.upsert({
      where: { actorId_targetId: { actorId: demoId, targetId: actorId } },
      create: { actorId: demoId, targetId: actorId, action: 'like', source: 'daily' },
      update: { action: 'like' },
    });
    await this.likes.createMatch(actorId, demoId, 'daily');
  }

  async replyOnce(matchId: string, demoId: string) {
    const already = await this.prisma.message.findFirst({ where: { matchId, senderId: demoId } });
    if (already) return;
    const m = await this.prisma.match.findUniqueOrThrow({ where: { id: matchId } });
    const otherId = m.userLow === demoId ? m.userHigh : m.userLow;
    const other = await this.prisma.user.findUnique({ where: { id: otherId }, select: { locale: true } });
    const body = other?.locale === 'ru' ? DEMO_REPLY.ru : DEMO_REPLY.en;
    const msg = await this.prisma.message.create({ data: { matchId, senderId: demoId, clientMessageId: randomUUID(), body } });
    this.rt.emit(otherId, 'message.new', { matchId, message: { id: msg.id, clientMessageId: msg.clientMessageId, body, fromMe: false, createdAt: msg.createdAt, read: false, safetyTip: false } });
    this.logger.debug('demo replied');
  }
}
