/**
 * ENG-014: Today's Souls ranking. Pure: candidates are already eligible and scored.
 */
import type { ArchetypeKey } from './types';

export interface RankCandidate {
  id: string;
  score: number;
  archetype: ArchetypeKey;
  lastActiveAt: string;
  createdAt: string;
  /** Alpha demo profiles always rank after real people of the same tier (ALPHA-002). */
  isDemo?: boolean;
}

const DAY = 86_400_000;

export function freshness(lastActiveAt: string, now: string): number {
  const days = (Date.parse(now) - Date.parse(lastActiveAt)) / DAY;
  if (days <= 1) return 1;
  if (days <= 7) return 0.95;
  if (days <= 30) return 0.8;
  return 0.6;
}

export function newUserBoost(createdAt: string, now: string): number {
  return (Date.parse(now) - Date.parse(createdAt)) / DAY <= 7 ? 1.1 : 1;
}

const tierBucket = (score: number) => (score >= 75 ? 3 : score >= 55 ? 2 : score >= 35 ? 1 : 0);

export function rankDailySet(candidates: RankCandidate[], now: string, size: number, maxSameArchetypeRun = 3): string[] {
  const ranked = candidates
    .map((c) => ({ c, rank: c.score * freshness(c.lastActiveAt, now) * newUserBoost(c.createdAt, now) }))
    .sort((x, y) => {
      const tier = tierBucket(y.c.score) - tierBucket(x.c.score);
      if (tier !== 0) return tier;
      if (!!x.c.isDemo !== !!y.c.isDemo) return x.c.isDemo ? 1 : -1;
      return y.rank - x.rank || (x.c.id < y.c.id ? -1 : 1);
    })
    .map((x) => x.c);

  // Diversity: avoid more than `maxSameArchetypeRun` of the same archetype in a row.
  const out: RankCandidate[] = [];
  const pool = [...ranked];
  while (out.length < size && pool.length > 0) {
    const run = out.slice(-maxSameArchetypeRun);
    const blocked = run.length === maxSameArchetypeRun && run.every((r) => r.archetype === run[0]?.archetype) ? run[0]?.archetype : null;
    const idx = blocked ? pool.findIndex((p) => p.archetype !== blocked) : 0;
    out.push(...pool.splice(idx === -1 ? 0 : idx, 1));
  }
  return out.map((c) => c.id);
}
