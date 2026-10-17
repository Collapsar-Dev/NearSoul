import { AnalyticsService } from '../analytics/analytics.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { eligibility } from '../../engine';
import { AppError, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { EngineService } from '../engine/engine.service';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SubjectsService } from '../discovery/subjects.service';

export const LIKES_PER_DAY = 50;
export const LIKES_PER_DAY_NEW = 20;
const NEW_ACCOUNT_MS = 48 * 3_600_000;

export const pair = (a: string, b: string) => (a < b ? { userLow: a, userHigh: b } : { userLow: b, userHigh: a });

/** LIKE-001/002: idempotent likes, server-side mutual match in one transaction. */
@Injectable()
export class LikesService {
  /** Hook for alpha demo profiles (ALPHA-002); set by DemoService. */
  onLikedDemo: ((actorId: string, demoId: string, score: number) => Promise<void>) | null = null;
  /** Alpha: a few demo profiles like a new tester once, so "Liked you" can be tried (set by DemoService). */
  beforeReceived: ((userId: string) => Promise<void>) | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly subjects: SubjectsService,
    private readonly engine: EngineService,
    private readonly notifications: NotificationsService,
    private readonly rt: RealtimeGateway,
    private readonly analytics: AnalyticsService,
    private readonly billing: BillingService,
  ) {}

  /** People who liked you and are still waiting (CR-18): a count for everyone, the list from Gold up. */
  async received(userId: string) {
    await this.beforeReceived?.(userId);
    const likes = await this.prisma.like.findMany({ where: { targetId: userId, action: 'like' }, orderBy: { createdAt: 'desc' }, take: 200 });
    const actorIds = likes.map((l) => l.actorId);
    if (!actorIds.length) return { count: 0, canSee: (await this.billing.features(userId)).seeLikes, ids: [] as string[] };
    const [mine, facts, active] = await Promise.all([
      this.prisma.like.findMany({ where: { actorId: userId, targetId: { in: actorIds } }, select: { targetId: true } }),
      this.subjects.pairFacts(userId, actorIds, 0),
      this.prisma.user.findMany({ where: { id: { in: actorIds }, status: 'active', hiddenByModeration: false }, select: { id: true } }),
    ]);
    const answered = new Set(mine.map((m) => m.targetId));
    const alive = new Set(active.map((a) => a.id));
    const waiting = actorIds.filter((id) => alive.has(id) && !answered.has(id) && !facts.blocked.has(id) && !facts.matched.has(id));
    const canSee = (await this.billing.features(userId)).seeLikes;
    return { count: waiting.length, canSee, ids: canSee ? waiting : [] };
  }

  /** Gold+: undo your most recent pass from the last 24 h so the person shows up again (CR-18). */
  async rewind(userId: string) {
    if (!(await this.billing.features(userId)).rewind) throw new AppError(402, 'UPGRADE_REQUIRED', 'Rewind is part of Gold.', { feature: 'rewind' });
    const last = await this.prisma.like.findFirst({ where: { actorId: userId, action: 'pass', createdAt: { gte: new Date(Date.now() - 86_400_000) } }, orderBy: { createdAt: 'desc' } });
    if (!last) throw notFound('Nothing to undo');
    await this.prisma.like.delete({ where: { actorId_targetId: { actorId: userId, targetId: last.targetId } } });
    return { targetId: last.targetId };
  }

  async act(actorId: string, targetId: string, action: 'like' | 'pass', source: 'daily' | 'nearby' | 'profile') {
    if (actorId === targetId) throw notFound();
    const reachable = await this.reachable(actorId, targetId, source);
    if (!reachable) throw notFound();
    const subjects = await this.subjects.load([actorId, targetId]);
    const a = subjects.get(actorId);
    const b = subjects.get(targetId);
    if (!a || !b) throw notFound();
    const facts = await this.subjects.pairFacts(actorId, [targetId], 0);
    const e = eligibility(a.eligibility, b.eligibility, {
      mode: source === 'nearby' ? 'nearby' : 'daily',
      blockedEitherWay: facts.blocked.has(targetId),
      previouslyMatched: facts.matched.has(targetId),
      passedRecently: false,
    });
    // Nearby likes stay valid after the window ends (the alert happened while both were open).
    const ok = e.eligible || (source === 'nearby' && !e.eligible && e.reason === 'NOT_OPEN');
    if (!ok) throw notFound();
    if (action === 'like') await this.checkDailyLimit(actorId);

    const existing = await this.prisma.like.findUnique({ where: { actorId_targetId: { actorId, targetId } } });
    if (existing && existing.action === action) return { action, match: await this.matchFor(actorId, targetId) };
    await this.prisma.like.upsert({
      where: { actorId_targetId: { actorId, targetId } },
      create: { actorId, targetId, action, source },
      update: { action, source, createdAt: new Date() },
    });
    this.analytics.track(actorId, action === 'like' ? 'like_sent' : 'pass_sent', { source });
    if (action === 'pass') return { action, match: null };

    const reverse = await this.prisma.like.findUnique({ where: { actorId_targetId: { actorId: targetId, targetId: actorId } } });
    if (reverse?.action === 'like') {
      const match = await this.createMatch(actorId, targetId, source);
      return { action, match };
    }
    if (b.isDemo && this.onLikedDemo) {
      const cfg = await this.engine.matchConfig();
      const c = this.subjects.compat(a, b, cfg);
      await this.onLikedDemo(actorId, targetId, c?.score ?? 0);
      return { action, match: await this.matchFor(actorId, targetId) };
    }
    return { action, match: null };
  }

  /** Concurrent mutual likes create exactly one match (unique pair + conflict handling). */
  async createMatch(a: string, b: string, source: 'daily' | 'nearby' | 'profile') {
    const p = pair(a, b);
    let created = false;
    let match;
    try {
      match = await this.prisma.match.create({ data: { ...p, source } });
      created = true;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        match = await this.prisma.match.findUniqueOrThrow({ where: { userLow_userHigh: p } });
      } else throw err;
    }
    if (created) {
      await this.prisma.pairOutcome.updateMany({ where: p, data: { matchedAt: new Date() } });
      this.analytics.track(a, 'match_created', { source });
      this.analytics.track(b, 'match_created', { source });
      for (const [me, other] of [[a, b], [b, a]] as const) {
        await this.notifications.notify(me, 'new_match', { matchId: match.id, userId: other, source });
        this.rt.emit(me, 'match.new', { matchId: match.id, userId: other, source });
      }
    }
    return { id: match.id, nearby: source === 'nearby' };
  }

  private async matchFor(a: string, b: string) {
    const m = await this.prisma.match.findUnique({ where: { userLow_userHigh: pair(a, b) } });
    return m && !m.endedAt ? { id: m.id, nearby: m.source === 'nearby' } : null;
  }

  /** Likes only for people the actor could actually see (daily set / nearby alert / match context). */
  private async reachable(actorId: string, targetId: string, source: string): Promise<boolean> {
    if (source === 'nearby') {
      const alert = await this.prisma.nearbyAlert.findFirst({
        where: { sentAt: { not: null, gte: new Date(Date.now() - 86_400_000) }, OR: [{ userA: actorId, userB: targetId }, { userA: targetId, userB: actorId }] },
      });
      return !!alert;
    }
    const since = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    if (await this.prisma.dailySet.findFirst({ where: { userId: actorId, date: { gte: since }, candidateIds: { has: targetId } } })) return true;
    // Gold+ can like back someone from "Liked you" (CR-18).
    const likedMe = await this.prisma.like.findUnique({ where: { actorId_targetId: { actorId: targetId, targetId: actorId } } });
    return likedMe?.action === 'like' && (await this.billing.features(actorId)).seeLikes;
  }

  private async checkDailyLimit(actorId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: actorId }, select: { createdAt: true } });
    // New accounts stay limited whatever the level (anti-spam); after that Gold doubles it and VIP has no daily cap.
    const tier = await this.billing.tier(actorId);
    const isNew = Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_MS;
    if (!isNew && tier === 'vip') return;
    const limit = isNew ? LIKES_PER_DAY_NEW : tier === 'gold' ? LIKES_PER_DAY * 2 : LIKES_PER_DAY;
    const count = await this.prisma.like.count({ where: { actorId, action: 'like', createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (count >= limit) throw new AppError(429, 'LIKE_LIMIT', 'You’ve reached today’s like limit. New likes tomorrow.', { limit });
  }
}
