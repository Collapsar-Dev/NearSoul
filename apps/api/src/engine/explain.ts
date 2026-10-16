/**
 * ENG-013 tips and RPT-001/RPT-002/RPT-003 report data builders.
 * The AI writer turns this structured data into prose; it must never add facts.
 */
import { LAYERS, tierFor, type CompatResult, type Layer, type Tier } from './compatibility';
import type { ArchetypeKey, Band, Domain, SoulProfile } from './types';
import { DOMAINS } from './types';

export type ShareLevel = 'minimal' | 'standard' | 'deep';
const SHARE_RANK: Record<ShareLevel, number> = { minimal: 0, standard: 1, deep: 2 };

/** RPT-003 reciprocity: you see as deep as you share. */
export function effectiveShareLevel(a: ShareLevel, b: ShareLevel): ShareLevel {
  return SHARE_RANK[a] <= SHARE_RANK[b] ? a : b;
}

/** Tips about `other`, derived only from their relationship and communication layers. */
export function tipsAbout(other: SoulProfile): string[] {
  const tips: string[] = [];
  const r = other.relationship;
  const c = other.communication;
  if (r.conflict_style.value === 'cool_down_then_talk') tips.push('TIP_GIVE_TIME_AFTER_CONFLICT');
  if (r.conflict_style.value === 'talk_now') tips.push('TIP_TALK_IT_THROUGH');
  if (c.texting_rhythm.value === 'daily_checkin') tips.push('TIP_DAILY_CHECKIN');
  if (c.texting_rhythm.value === 'prefer_meeting') tips.push('TIP_PREFERS_MEETING');
  const depth = c.conversation_depth.score;
  if (depth !== null && depth >= 65) tips.push('TIP_DEEP_QUESTIONS');
  if (depth !== null && depth <= 35) tips.push('TIP_KEEP_IT_LIGHT');
  for (const lang of r.care_language.value ?? []) tips.push(`TIP_SHOW_CARE:${lang}`);
  if ((r.independence_need.score ?? 0) >= 65) tips.push('TIP_RESPECT_SPACE');
  if ((r.reassurance_need.score ?? 0) >= 65) tips.push('TIP_REASSURE');
  return tips;
}

export interface PairReportData {
  effectiveShareLevel: ShareLevel;
  tier: Tier;
  score: number;
  reasons: string[];
  frictions: string[];
  tips: string[];
  layers: Partial<Record<Layer, Tier | null>>;
  bigFive: { viewer: Partial<Record<Domain, Band | null>>; other: Partial<Record<Domain, Band | null>> } | null;
  archetypes: { viewer: ArchetypeKey; other: ArchetypeKey };
}

export interface PairTeaserData {
  tier: Tier;
  reasons: string[];
  lockedSections: { key: 'frictions' | 'tips' | 'layers' | 'first_date'; count: number }[];
}

/** RPT-002: full report data for `viewer` about the pair, filtered by the effective share level. */
export function buildPairReportData(
  viewer: SoulProfile,
  other: SoulProfile,
  compat: CompatResult,
  viewerLevel: ShareLevel,
  otherLevel: ShareLevel,
): PairReportData {
  const level = effectiveShareLevel(viewerLevel, otherLevel);
  const standard = SHARE_RANK[level] >= SHARE_RANK.standard;
  const deep = level === 'deep';
  const bands = (p: SoulProfile) => Object.fromEntries(DOMAINS.map((d) => [d, p.domains[d].band])) as Record<Domain, Band | null>;
  return {
    effectiveShareLevel: level,
    tier: compat.tier,
    score: compat.score,
    reasons: compat.reasons.slice(0, 6),
    frictions: standard ? compat.frictions.slice(0, 3) : [],
    tips: standard ? tipsAbout(other).slice(0, 6) : [],
    layers: standard
      ? Object.fromEntries(LAYERS.map((l) => {
        const s = compat.layers[l].score;
        return [l, s === null ? null : tierFor(Math.round(s * 100))];
      }))
      : {},
    bigFive: deep ? { viewer: bands(viewer), other: bands(other) } : null,
    archetypes: { viewer: viewer.archetype, other: other.archetype },
  };
}

/** Free teaser (RPT-002): tier, 3 reasons, and the titles/counts of locked sections only. */
export function buildPairTeaser(full: PairReportData): PairTeaserData {
  return {
    tier: full.tier,
    reasons: full.reasons.slice(0, 3),
    lockedSections: [
      { key: 'frictions', count: full.frictions.length },
      { key: 'tips', count: full.tips.length },
      { key: 'layers', count: Object.keys(full.layers).length },
      { key: 'first_date', count: 3 },
    ],
  };
}

export interface SelfReportData {
  archetype: ArchetypeKey;
  domains: Record<Domain, { band: Band | null; confidence: number }>;
  strengths: string[];
  relationshipStyle: string[];
  needs: string[];
  growthEdges: string[];
}

const STRENGTH_BY_BAND: Record<Domain, Record<Band, string>> = {
  O: { high: 'curious', balanced: 'open_minded', low: 'grounded' },
  C: { high: 'reliable', balanced: 'adaptable', low: 'flexible' },
  E: { high: 'energizing', balanced: 'sociable', low: 'reflective' },
  A: { high: 'kind', balanced: 'fair', low: 'independent_minded' },
  S: { high: 'steady', balanced: 'balanced', low: 'feels_deeply' },
};

/** RPT-001: deterministic self report data (codes only; text comes from band texts / AI writer). */
export function buildSelfReportData(p: SoulProfile): SelfReportData {
  const known = DOMAINS.filter((d) => p.domains[d].band !== null);
  const strengths = [...known]
    .sort((a, b) => Math.abs((p.domains[b].score as number) - 50) - Math.abs((p.domains[a].score as number) - 50))
    .slice(0, 3)
    .map((d) => STRENGTH_BY_BAND[d][p.domains[d].band as Band]);
  const r = p.relationship;
  const style: string[] = [];
  if (r.closeness_comfort.band) style.push(`CLOSENESS_${r.closeness_comfort.band.toUpperCase()}`);
  if (r.independence_need.band) style.push(`INDEPENDENCE_${r.independence_need.band.toUpperCase()}`);
  if (r.conflict_style.value) style.push(`CONFLICT_${r.conflict_style.value.toUpperCase()}`);
  const needs = tipsAbout(p).map((t) => t.replace(/^TIP_/, 'NEED_'));
  const growth: string[] = [];
  if (r.reassurance_need.band === 'high' && r.independence_need.band === 'high') growth.push('GROWTH_CLOSENESS_AND_SPACE');
  if (p.domains.S.band === 'low') growth.push('GROWTH_SELF_SOOTHING');
  if (p.domains.C.band === 'low') growth.push('GROWTH_FOLLOW_THROUGH');
  if (p.domains.A.band === 'low') growth.push('GROWTH_SOFT_START');
  return {
    archetype: p.archetype,
    domains: Object.fromEntries(DOMAINS.map((d) => [d, { band: p.domains[d].band, confidence: p.domains[d].confidence }])) as SelfReportData['domains'],
    strengths,
    relationshipStyle: style,
    needs,
    growthEdges: growth.slice(0, 3),
  };
}
