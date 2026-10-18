import { AnalyticsService } from '../analytics/analytics.service';
import { Controller, Get, Headers, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { readyForDating } from '../../engine';
import { notFound } from '../../common/errors';
import { familyIds } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';
import { BillingService } from '../billing/billing.service';
import { localeFrom } from '../engine/engine.controller';
import { EngineService } from '../engine/engine.service';
import { DailySetService } from './daily-set.service';
import { ProfileViewService } from './profile-view.service';
import { SubjectsService } from './subjects.service';

@Controller('v1')
@RequireGate('active')
export class DiscoveryController {
  constructor(
    private readonly daily: DailySetService,
    private readonly subjects: SubjectsService,
    private readonly views: ProfileViewService,
    private readonly engine: EngineService,
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
    private readonly billing: BillingService,
  ) {}

  /** VIP (CR-18): how many profiles the person has. Only the number, never which ones. */
  private async personaCount(viewerId: string, targetId: string): Promise<number | undefined> {
    if (!(await this.billing.features(viewerId)).seePersonaCount) return undefined;
    const ids = await familyIds(this.prisma, targetId);
    return this.prisma.user.count({ where: { id: { in: ids }, status: 'active' } });
  }

  @Get('daily-set')
  async dailySet(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    const locale = localeFrom(lang);
    const { date, ids, refreshAt } = await this.daily.get(user.id);
    const [subjects, facts, cfg] = await Promise.all([this.subjects.load([user.id, ...ids]), this.subjects.pairFacts(user.id, ids), this.engine.matchConfig()]);
    const viewer = subjects.get(user.id)!;
    const cards = [];
    for (const id of ids) {
      const s = subjects.get(id);
      // Re-check at read time: blocks, suspensions or deletions since generation remove the card.
      if (!s || facts.blocked.has(id) || facts.matched.has(id) || s.eligibility.status !== 'active' || s.eligibility.hiddenByModeration) continue;
      const view = await this.views.build(viewer, s, this.subjects.compat(viewer, s, cfg), locale);
      cards.push({ ...view, personaCount: await this.personaCount(user.id, id), action: facts.liked.has(id) ? 'like' : facts.passed.has(id) ? 'pass' : null });
    }
    this.analytics.track(user.id, 'daily_set_viewed', { count: cards.length });
    // Too many skipped questions leave the engine nothing to compare (every score is 0): tell the app why it's empty.
    const domains = viewer.profile ? Object.values(viewer.profile.domains) : [];
    const needsAnswers = domains.length === 0 || domains.every((d) => d.score === null);
    // Matching is mutual, so the viewer must be ready too (2 photos, discoverable…); tell the app what's missing.
    const viewerBlocked = readyForDating(viewer.eligibility, 'daily');
    return { date, refreshAt, remaining: cards.filter((c) => !c.action).length, cards, needsAnswers, viewerBlocked };
  }

  /** Public profile: only for people in your daily set, nearby list or matches (prevents scraping by id). */
  @Get('profiles/:id')
  async profile(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('accept-language') lang?: string) {
    const access = await this.canView(user.id, id);
    if (!access.allowed) throw notFound();
    const subjects = await this.subjects.load([user.id, id]);
    const viewer = subjects.get(user.id)!;
    const target = subjects.get(id);
    if (!target || target.eligibility.status !== 'active') throw notFound();
    const facts = await this.subjects.pairFacts(user.id, [id]);
    if (facts.blocked.has(id)) throw notFound();
    const cfg = await this.engine.matchConfig();
    const view = await this.views.build(viewer, target, this.subjects.compat(viewer, target, cfg), localeFrom(lang), { matched: access.matched });
    return { ...view, personaCount: await this.personaCount(user.id, id) };
  }

  async canView(viewerId: string, targetId: string): Promise<{ allowed: boolean; matched: boolean }> {
    const [low, high] = viewerId < targetId ? [viewerId, targetId] : [targetId, viewerId];
    const match = await this.prisma.match.findUnique({ where: { userLow_userHigh: { userLow: low, userHigh: high } } });
    if (match && !match.endedAt) return { allowed: true, matched: true };
    if (match) return { allowed: false, matched: false };
    const since = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    const inSet = await this.prisma.dailySet.findFirst({ where: { userId: viewerId, date: { gte: since }, candidateIds: { has: targetId } } });
    if (inSet) return { allowed: true, matched: false };
    // Someone who wrote to the viewer first (VIP, CR-26): the viewer can look before answering.
    const request = await this.prisma.messageRequest.findFirst({ where: { fromId: targetId, toId: viewerId, status: 'pending' } });
    if (request) return { allowed: true, matched: false };
    // Gold+ can open profiles from "Liked you" (CR-18).
    const likedMe = await this.prisma.like.findUnique({ where: { actorId_targetId: { actorId: targetId, targetId: viewerId } } });
    if (likedMe?.action === 'like' && (await this.billing.features(viewerId)).seeLikes) return { allowed: true, matched: false };
    const nearby = await this.prisma.nearbyAlert.findFirst({
      where: { sentAt: { not: null, gte: new Date(Date.now() - 86_400_000) }, OR: [{ userA: viewerId, userB: targetId }, { userA: targetId, userB: viewerId }] },
    });
    return { allowed: !!nearby, matched: false };
  }
}
