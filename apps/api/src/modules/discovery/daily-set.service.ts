import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { eligibility, rankDailySet, type CompatResult } from '../../engine';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';
import { EngineService } from '../engine/engine.service';
import { BillingService, UNLIMITED_DAILY_CAP } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { inQuietHours, localTime } from '../notifications/push-policy';
import { SubjectsService, type Subject } from './subjects.service';

const SEEN_DAYS = 30;
const MAX_POOL = 2000;

/** Local date key: the set refreshes at 12:00 in the user's timezone (ENG-014). */
export function dailyKey(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const local = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  if (Number(parts.hour) < 12) local.setUTCDate(local.getUTCDate() - 1);
  return local.toISOString().slice(0, 10);
}

export function nextRefresh(now: Date, timezone: string): Date {
  // Find the next local 12:00 by stepping hours (robust across DST).
  const key = dailyKey(now, timezone);
  const t = new Date(now);
  t.setUTCMinutes(0, 0, 0);
  for (let i = 0; i < 48; i++) {
    t.setUTCHours(t.getUTCHours() + 1);
    if (dailyKey(t, timezone) !== key) return t;
  }
  return new Date(now.getTime() + 86_400_000);
}

@Injectable()
export class DailySetService {
  private readonly logger = new Logger('DailySet');

  constructor(
    private readonly prisma: PrismaService,
    private readonly subjects: SubjectsService,
    private readonly engine: EngineService,
    private readonly notifications: NotificationsService,
    private readonly billing: BillingService,
  ) {}

  /**
   * "Your Today's Souls are ready" (D16, NOTIF-001): once per daily key, after 12:00 local and before quiet hours,
   * only when the new set actually has people in it and the person hasn't opened it yet.
   */
  async announceDue(now = new Date()): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: { status: 'active', discoveryEnabled: true, isDemo: false, hiddenByModeration: false },
      select: { id: true, timezone: true, dailyAnnouncedKey: true },
    });
    let sent = 0;
    for (const u of users) {
      const key = dailyKey(now, u.timezone);
      const hour = localTime(now, u.timezone).hour;
      if (u.dailyAnnouncedKey === key || hour < 12 || inQuietHours(hour)) continue;
      const claimed = await this.prisma.user.updateMany({ where: { id: u.id, dailyAnnouncedKey: u.dailyAnnouncedKey }, data: { dailyAnnouncedKey: key } });
      if (!claimed.count) continue;
      if (await this.prisma.dailySet.findUnique({ where: { userId_date: { userId: u.id, date: key } } })) continue; // already opened today
      const { ids } = await this.get(u.id, now);
      if (!ids.length) continue;
      await this.notifications.notify(u.id, 'daily_set_ready', { date: key });
      sent++;
      if (sent >= 500) break; // the rest go on the next tick
    }
    return sent;
  }

  @Interval(5 * 60_000)
  async tickAnnounce() {
    if (env().APP_ENV === 'test') return;
    try {
      await this.announceDue();
    } catch (err) {
      this.logger.error({ msg: 'daily announce failed', err: String(err) });
    }
  }

  async get(userId: string, now = new Date()): Promise<{ date: string; ids: string[]; refreshAt: Date }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
    const date = dailyKey(now, user.timezone);
    const existing = await this.prisma.dailySet.findUnique({ where: { userId_date: { userId, date } } });
    const size = (await this.billing.features(userId)).dailySetSize ?? UNLIMITED_DAILY_CAP;
    let ids = existing?.candidateIds ?? null;
    if (ids && ids.length > 0) {
      // If every candidate has since left (deleted, suspended, hidden), rebuild instead of showing an empty day.
      const alive = await this.prisma.user.count({ where: { id: { in: ids }, status: 'active', hiddenByModeration: false } });
      if (alive === 0) ids = null;
    }
    // An empty day (built before the profile was ready, or before new people joined) is retried every few minutes
    // instead of staying empty until tomorrow.
    if (ids && ids.length === 0 && existing && now.getTime() - existing.generatedAt.getTime() > 2 * 60_000) ids = null;
    if (ids && existing && size > existing.size) {
      // Upgraded today: keep today's people and add more up to the new level.
      ids = await this.generate(userId, date, now, size, ids);
    }
    ids ??= await this.generate(userId, date, now, size);
    return { date, ids, refreshAt: nextRefresh(now, user.timezone) };
  }

  /** Builds and stores the set. Stable for the rest of the day. */
  async generate(userId: string, date: string, now = new Date(), total = env().DAILY_SET_SIZE, keep: string[] = []): Promise<string[]> {
    const viewer = await this.subjects.one(userId, now);
    if (!viewer?.profile) return keep;
    const cfg = await this.engine.matchConfig();
    const seen = await this.recentlyShown(userId, now);
    for (const id of keep) seen.add(id);
    const size = Math.max(0, total - keep.length);
    const ageSteps = [0, 2, 4];
    let picked: { s: Subject; c: CompatResult }[] = [];
    const flexible = (await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { flexibleFallback: true } })).flexibleFallback;
    for (const [step, widen] of ageSteps.entries()) {
      if (step > 0 && !flexible) break;
      picked = await this.candidates(viewer, seen, widen, step === 2, cfg);
      if (picked.length >= size) break;
    }
    const added = rankDailySet(
      picked.map(({ s, c }) => ({ id: s.id, score: c.score, archetype: s.profile!.archetype, lastActiveAt: s.lastActiveAt.toISOString(), createdAt: s.createdAt.toISOString(), isDemo: s.isDemo })),
      now.toISOString(),
      size,
    );
    const ids = [...keep, ...added];
    await this.prisma.dailySet.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, candidateIds: ids, configVersion: cfg.version, size: total },
      update: { candidateIds: ids, configVersion: cfg.version, generatedAt: now, size: total },
    });
    const byId = new Map(picked.map((p) => [p.s.id, p]));
    for (const id of added) {
      const [low, high] = userId < id ? [userId, id] : [id, userId];
      await this.prisma.pairOutcome.upsert({
        where: { userLow_userHigh: { userLow: low, userHigh: high } },
        create: { userLow: low, userHigh: high, tier: byId.get(id)!.c.tier, configVersion: cfg.version },
        update: {},
      });
    }
    return ids;
  }

  private async recentlyShown(userId: string, now: Date): Promise<Set<string>> {
    const since = new Date(now.getTime() - SEEN_DAYS * 86_400_000).toISOString().slice(0, 10);
    const sets = await this.prisma.dailySet.findMany({ where: { userId, date: { gte: since } }, select: { candidateIds: true } });
    return new Set(sets.flatMap((s) => s.candidateIds));
  }

  private async candidates(viewer: Subject, seen: Set<string>, widenYears: number, anyCity: boolean, cfg: Awaited<ReturnType<EngineService['matchConfig']>>) {
    const v = viewer.eligibility;
    const pool = await this.prisma.user.findMany({
      where: {
        id: { not: viewer.id },
        status: 'active',
        discoveryEnabled: true,
        hiddenByModeration: false,
        ...(env().APP_ENV === 'alpha' || env().APP_ENV === 'development' || env().APP_ENV === 'test' ? {} : { isDemo: false }),
        profile: {
          gender: { in: v.interestedIn },
          interestedIn: { has: v.gender },
          ...(anyCity || !viewer.cityId ? {} : { cityId: viewer.cityId }),
        },
      },
      select: { id: true },
      take: MAX_POOL,
    });
    const ids = pool.map((p) => p.id).filter((id) => !seen.has(id));
    const [subjects, facts] = await Promise.all([this.subjects.load(ids), this.subjects.pairFacts(viewer.id, ids)]);
    // Widening only relaxes the viewer's own age preference, never the candidate's (their consent).
    const widenedViewer = { ...v, ageMin: Math.max(18, v.ageMin - widenYears), ageMax: v.ageMax + widenYears };
    const out: { s: Subject; c: CompatResult }[] = [];
    for (const s of subjects.values()) {
      if (facts.liked.has(s.id)) continue;
      const e = eligibility(widenedViewer, s.eligibility, {
        mode: 'daily',
        blockedEitherWay: facts.blocked.has(s.id),
        previouslyMatched: facts.matched.has(s.id),
        passedRecently: facts.passed.has(s.id),
      });
      if (!e.eligible) continue;
      const c = this.subjects.compat(viewer, s, cfg);
      if (c) out.push({ s, c });
    }
    return out;
  }
}
