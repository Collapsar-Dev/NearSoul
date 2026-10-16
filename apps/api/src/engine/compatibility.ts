/**
 * ENG-012 / ENG-013: compatibility model v2. Pure, symmetric, bounded 0–100, deterministic.
 */
import { DEFAULT_MATCH_CONFIG, pairKey, type MatchConfig } from './match-config';
import type { CareLanguage, Domain, Intent, KidsPlan, SoulProfile, Value } from './types';

export type Layer = 'values' | 'relationship' | 'lifestyle' | 'communication' | 'personality';
export const LAYERS: readonly Layer[] = ['values', 'relationship', 'lifestyle', 'communication', 'personality'];

export type Tier = 'strong' | 'good' | 'some' | 'low';

export interface CompatSubject {
  profile: SoulProfile;
  intent: Intent;
  interests: string[];
}

export interface LayerScore {
  score: number | null; // 0–1
  confidence: number; // 0–1
}

export interface CompatResult {
  score: number; // 0–100
  tier: Tier;
  confidence: number;
  layers: Record<Layer, LayerScore>;
  reasons: string[];
  frictions: string[];
  configVersion: string;
}

// ---- helpers (all symmetric) ----
export const sim = (a: number, b: number) => 1 - Math.abs(a - b) / 100;
export const level = (a: number, b: number) => (a + b) / 200;
export const ord = (ia: number, ib: number, steps: number) => 1 - Math.abs(ia - ib) / (steps - 1);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const ORDINALS = {
  activity_level: ['low', 'moderate', 'high', 'very_high'],
  smoking: ['never', 'socially', 'regularly'],
  drinking: ['never', 'rarely', 'socially', 'often'],
  texting_rhythm: ['all_day', 'few_times_day', 'daily_checkin', 'prefer_meeting'],
} as const;

function ordinal(kind: keyof typeof ORDINALS, a: string | null, b: string | null): number | null {
  if (a === null || b === null) return null;
  const list = ORDINALS[kind] as readonly string[];
  return ord(list.indexOf(a), list.indexOf(b), list.length);
}

const num = (a: number | null, b: number | null, f: (x: number, y: number) => number): number | null =>
  a === null || b === null ? null : clamp01(f(a, b));

const WANTS_MORE = new Set<KidsPlan>(['have_want_more', 'want']);
const NO_MORE = new Set<KidsPlan>(['have_no_more', 'dont_want']);

export function kidsSimilarity(a: KidsPlan | null, b: KidsPlan | null, cfg: MatchConfig): number | null {
  if (a === null || b === null) return null;
  const t = cfg.tables.kids;
  if (a === 'open' || a === 'not_sure' || b === 'open' || b === 'not_sure') return t.openAny;
  if ((WANTS_MORE.has(a) && WANTS_MORE.has(b)) || (NO_MORE.has(a) && NO_MORE.has(b))) return t.same;
  return t.conflict;
}

function categoricalTable(a: string | null, b: string | null, same: number, anyKey: string, any: number, other: number) {
  if (a === null || b === null) return null;
  if (a === b) return same;
  if (a === anyKey || b === anyKey) return any;
  return other;
}

/** Penalizes "needs lots of reassurance" paired with "needs lots of space", both directions averaged. */
export function reassuranceFit(rA: number | null, iA: number | null, rB: number | null, iB: number | null): number | null {
  if (rA === null || iA === null || rB === null || iB === null) return null;
  const term = (r: number, i: number) => clamp01(1 - Math.max(0, r + i - 130) / 70);
  return (term(rA, iB) + term(rB, iA)) / 2;
}

interface Dim {
  layer: Layer;
  key: string;
  weight: number;
  s: number | null;
}

function dimensions(A: SoulProfile, B: SoulProfile, cfg: MatchConfig): Dim[] {
  const w = cfg.inner;
  const t = cfg.tables;
  const ra = A.relationship;
  const rb = B.relationship;
  const values = (): number | null => {
    const va = A.values.values.value;
    const vb = B.values.values.value;
    if (!va || !vb) return null;
    return va.filter((v) => vb.includes(v)).length / 3;
  };
  const care = (): number | null => {
    const ca = ra.care_language.value;
    const cb = rb.care_language.value;
    if (!ca || !cb) return null;
    return ca.some((c) => cb.includes(c)) ? t.care_language.overlap : t.care_language.none;
  };
  const conflict = (): number | null => {
    const a = ra.conflict_style.value;
    const b = rb.conflict_style.value;
    if (a === null || b === null) return null;
    return a === b ? 1 : (t.conflict_style[pairKey(a, b)] ?? 0);
  };
  const d = A.domains;
  const e = B.domains;
  const p = (k: Domain, f: (x: number, y: number) => number) => num(d[k].score, e[k].score, f);
  return [
    { layer: 'values', key: 'values', weight: w.values.values, s: values() },
    { layer: 'values', key: 'kids_plan', weight: w.values.kids_plan, s: kidsSimilarity(A.values.kids_plan.value, B.values.kids_plan.value, cfg) },
    {
      layer: 'values', key: 'life_direction', weight: w.values.life_direction,
      s: categoricalTable(A.values.life_direction.value, B.values.life_direction.value, t.life_direction.same, 'balance_all', t.life_direction.balanceAny, t.life_direction.other),
    },
    { layer: 'relationship', key: 'closeness_comfort', weight: w.relationship.closeness_comfort, s: num(ra.closeness_comfort.score, rb.closeness_comfort.score, sim) },
    { layer: 'relationship', key: 'independence_need', weight: w.relationship.independence_need, s: num(ra.independence_need.score, rb.independence_need.score, sim) },
    {
      layer: 'relationship', key: 'reassurance_fit', weight: w.relationship.reassurance_fit,
      s: reassuranceFit(ra.reassurance_need.score, ra.independence_need.score, rb.reassurance_need.score, rb.independence_need.score),
    },
    { layer: 'relationship', key: 'conflict_style', weight: w.relationship.conflict_style, s: conflict() },
    { layer: 'relationship', key: 'care_language', weight: w.relationship.care_language, s: care() },
    {
      layer: 'lifestyle', key: 'weekend_style', weight: w.lifestyle.weekend_style,
      s: categoricalTable(A.lifestyle.weekend_style.value, B.lifestyle.weekend_style.value, t.weekend_style.same, 'mix', t.weekend_style.mixAny, t.weekend_style.other),
    },
    { layer: 'lifestyle', key: 'spontaneity', weight: w.lifestyle.spontaneity, s: num(A.lifestyle.spontaneity.score, B.lifestyle.spontaneity.score, sim) },
    { layer: 'lifestyle', key: 'activity_level', weight: w.lifestyle.activity_level, s: ordinal('activity_level', A.lifestyle.activity_level.value, B.lifestyle.activity_level.value) },
    { layer: 'lifestyle', key: 'smoking', weight: w.lifestyle.smoking, s: ordinal('smoking', A.lifestyle.smoking.value, B.lifestyle.smoking.value) },
    { layer: 'lifestyle', key: 'drinking', weight: w.lifestyle.drinking, s: ordinal('drinking', A.lifestyle.drinking.value, B.lifestyle.drinking.value) },
    { layer: 'communication', key: 'texting_rhythm', weight: w.communication.texting_rhythm, s: ordinal('texting_rhythm', A.communication.texting_rhythm.value, B.communication.texting_rhythm.value) },
    { layer: 'communication', key: 'conversation_depth', weight: w.communication.conversation_depth, s: num(A.communication.conversation_depth.score, B.communication.conversation_depth.score, sim) },
    { layer: 'personality', key: 'O', weight: w.personality.O, s: p('O', sim) },
    { layer: 'personality', key: 'C', weight: w.personality.C, s: p('C', sim) },
    { layer: 'personality', key: 'E', weight: w.personality.E, s: p('E', (x, y) => 0.7 * sim(x, y) + 0.3) },
    { layer: 'personality', key: 'A', weight: w.personality.A, s: p('A', (x, y) => 0.5 * sim(x, y) + 0.5 * level(x, y)) },
    { layer: 'personality', key: 'S', weight: w.personality.S, s: p('S', (x, y) => 0.5 * sim(x, y) + 0.5 * level(x, y)) },
  ];
}

export function tierFor(score: number, cfg: MatchConfig = DEFAULT_MATCH_CONFIG): Tier {
  if (score >= cfg.tiers.strong) return 'strong';
  if (score >= cfg.tiers.good) return 'good';
  if (score >= cfg.tiers.some) return 'some';
  return 'low';
}

export function compatibility(a: CompatSubject, b: CompatSubject, cfg: MatchConfig = DEFAULT_MATCH_CONFIG): CompatResult {
  const dims = dimensions(a.profile, b.profile, cfg);
  const layers = {} as Record<Layer, LayerScore>;
  let weighted = 0;
  let knownWeight = 0;
  let confidence = 0;
  const totalLayerWeight = LAYERS.reduce((s, l) => s + cfg.layerWeights[l], 0);
  for (const l of LAYERS) {
    const ds = dims.filter((d) => d.layer === l);
    const all = ds.reduce((s, d) => s + d.weight, 0);
    const known = ds.filter((d) => d.s !== null);
    const kw = known.reduce((s, d) => s + d.weight, 0);
    const score = kw > 0 ? known.reduce((s, d) => s + d.weight * (d.s as number), 0) / kw : null;
    const conf = all > 0 ? kw / all : 0;
    layers[l] = { score: score === null ? null : round3(score), confidence: round3(conf) };
    if (score !== null) {
      weighted += cfg.layerWeights[l] * score;
      knownWeight += cfg.layerWeights[l];
    }
    confidence += cfg.layerWeights[l] * conf;
  }
  const mult = a.intent === b.intent ? cfg.intentMultiplier.same : cfg.intentMultiplier.other;
  const score = knownWeight > 0 ? Math.round(100 * mult * (weighted / knownWeight)) : 0;
  return {
    score,
    tier: tierFor(score, cfg),
    confidence: round3(confidence / totalLayerWeight),
    layers,
    reasons: reasonsFor(a, b, dims, cfg),
    frictions: frictionsFor(a.profile, b.profile, dims, cfg),
    configVersion: cfg.version,
  };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

// ---- reasons & frictions (ENG-013, codes in PRD appendix C) ----

interface Ranked {
  code: string;
  strength: number;
}

const byStrength = (x: Ranked, y: Ranked) => y.strength - x.strength || (x.code < y.code ? -1 : x.code > y.code ? 1 : 0);

function reasonsFor(a: CompatSubject, b: CompatSubject, dims: Dim[], cfg: MatchConfig): string[] {
  const A = a.profile;
  const B = b.profile;
  const lw = cfg.layerWeights;
  const s = (key: string) => dims.find((d) => d.key === key)?.s ?? null;
  const w = (key: string) => {
    const d = dims.find((x) => x.key === key);
    return d ? d.weight * lw[d.layer] : 0;
  };
  const out: Ranked[] = [];
  const add = (code: string, strength: number) => out.push({ code, strength });

  const va = A.values.values.value ?? [];
  const vb = B.values.values.value ?? [];
  for (const v of va.filter((x) => vb.includes(x)) as Value[]) add(`SHARED_VALUE:${v}`, w('values') / 3 + 0.01);
  if (s('kids_plan') === 1) add('KIDS_ALIGNED', w('kids_plan'));
  if (A.values.life_direction.value !== null && A.values.life_direction.value === B.values.life_direction.value) {
    add('SAME_LIFE_DIRECTION', w('life_direction'));
  }
  const da = A.communication.conversation_depth.score;
  const db = B.communication.conversation_depth.score;
  if (da !== null && db !== null) {
    if (da >= 65 && db >= 65) add('BOTH_DEEP_TALKERS', w('conversation_depth'));
    else if (da <= 35 && db <= 35) add('BOTH_PLAYFUL_TALKERS', w('conversation_depth'));
  }
  if (s('texting_rhythm') === 1) add('SAME_TEXTING_RHYTHM', w('texting_rhythm'));
  const cl = s('closeness_comfort');
  const ind = s('independence_need');
  if (cl !== null && ind !== null && cl >= 0.85 && ind >= 0.85) add('SIMILAR_CLOSENESS', w('closeness_comfort') + w('independence_need'));
  if (s('conflict_style') === 1) add('SAME_CONFLICT_STYLE', w('conflict_style'));
  const ca = A.relationship.care_language.value ?? [];
  const cb = B.relationship.care_language.value ?? [];
  for (const c of ca.filter((x) => cb.includes(x)) as CareLanguage[]) add(`SHARED_CARE_LANGUAGE:${c}`, w('care_language'));
  const wa = A.lifestyle.weekend_style.value;
  if (wa !== null && wa !== 'mix' && wa === B.lifestyle.weekend_style.value) add(`SIMILAR_WEEKENDS:${wa}`, w('weekend_style'));
  const sp = s('spontaneity');
  if (sp !== null && sp >= 0.85) add('SIMILAR_PACE', w('spontaneity'));
  if (s('activity_level') === 1) add('SIMILAR_ACTIVITY', w('activity_level'));
  const both = (k: Domain) => A.domains[k].band === 'high' && B.domains[k].band === 'high';
  if (both('O')) add('BOTH_CURIOUS', w('O'));
  if (both('C')) add('BOTH_ORGANIZED', w('C'));
  if (both('A')) add('BOTH_WARM', w('A'));
  if (both('S')) add('BOTH_STEADY', w('S'));
  const ib = new Set(b.interests);
  for (const i of [...new Set(a.interests)].filter((x) => ib.has(x)).sort()) add(`SHARED_INTEREST:${i}`, 0.04);
  if (a.intent === b.intent) add('SAME_INTENT', 0.05);
  return out.sort(byStrength).map((r) => r.code);
}

function frictionsFor(A: SoulProfile, B: SoulProfile, dims: Dim[], cfg: MatchConfig): string[] {
  const lw = cfg.layerWeights;
  const map: Record<string, { code: string; threshold: number }> = {
    spontaneity: { code: 'PACE_MISMATCH', threshold: 0.5 },
    closeness_comfort: { code: 'CLOSENESS_GAP', threshold: 0.5 },
    reassurance_fit: { code: 'REASSURANCE_SPACE', threshold: 0.5 },
    conflict_style: { code: 'CONFLICT_STYLE_GAP', threshold: 0.5 },
    texting_rhythm: { code: 'TEXTING_GAP', threshold: 0.34 },
    conversation_depth: { code: 'DEPTH_GAP', threshold: 0.5 },
    activity_level: { code: 'LIFESTYLE_ACTIVITY_GAP', threshold: 0.34 },
    life_direction: { code: 'DIFFERENT_DIRECTIONS', threshold: 0.2 },
  };
  const out: Ranked[] = [];
  for (const d of dims) {
    const m = map[d.key];
    if (m && d.s !== null && d.s <= m.threshold) out.push({ code: m.code, strength: (1 - d.s) * d.weight * lw[d.layer] });
  }
  const ea = A.domains.E.score;
  const eb = B.domains.E.score;
  if (ea !== null && eb !== null && sim(ea, eb) <= 0.5) {
    out.push({ code: 'SOCIAL_ENERGY_GAP', strength: (1 - sim(ea, eb)) * cfg.inner.personality.E * lw.personality });
  }
  return out.sort(byStrength).map((r) => r.code);
}
