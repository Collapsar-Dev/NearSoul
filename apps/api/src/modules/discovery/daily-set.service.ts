import { Injectable } from '@nestjs/common';
import { eligibility, rankDailySet, type CompatResult } from '../../engine';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';
import { EngineService } from '../engine/engine.service';
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
  constructor(private readonly prisma: PrismaService, private readonly subjects: SubjectsService, private readonly engine: EngineService) {}

  async get(userId: string, now = new Date()): Promise<{ date: string; ids: string[]; refreshAt: Date }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } });
    const date = dailyKey(now, user.timezone);
    const existing = await this.prisma.dailySet.findUnique({ where: { userId_date: { userId, date } } });
    const ids = existing?.candidateIds ?? (await this.generate(userId, date, now));
    return { date, ids, refreshAt: nextRefresh(now, user.timezone) };
  }

  /** Builds and stores the set. Stable for the rest of the day. */
  async generate(userId: string, date: string, now = new Date()): Promise<string[]> {
    const viewer = await this.subjects.one(userId, now);
    if (!viewer?.profile) return [];
    const cfg = await this.engine.matchConfig();
    const seen = await this.recentlyShown(userId, now);
    const size = env().DAILY_SET_SIZE;
    const ageSteps = [0, 2, 4];
    let picked: { s: Subject; c: CompatResult }[] = [];
    const flexible = (await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { flexibleFallback: true } })).flexibleFallback;
    for (const [step, widen] of ageSteps.entries()) {
      if (step > 0 && !flexible) break;
      picked = await this.candidates(viewer, seen, widen, step === 2, cfg);
      if (picked.length >= size) break;
    }
    const ids = rankDailySet(
      picked.map(({ s, c }) => ({ id: s.id, score: c.score, archetype: s.profile!.archetype, lastActiveAt: s.lastActiveAt.toISOString(), createdAt: s.createdAt.toISOString(), isDemo: s.isDemo })),
      now.toISOString(),
      size,
    );
    await this.prisma.dailySet.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, candidateIds: ids, configVersion: cfg.version },
      update: { candidateIds: ids, configVersion: cfg.version, generatedAt: now },
    });
    const byId = new Map(picked.map((p) => [p.s.id, p]));
    for (const id of ids) {
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
