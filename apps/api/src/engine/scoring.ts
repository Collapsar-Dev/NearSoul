/**
 * ENG-005 / ENG-006 / ENG-008: turns answers into a SoulProfile. Pure and deterministic.
 */
import { CONSISTENCY_PAIRS, ITEMS_BY_KEY, QUICK_SCAN_ITEMS, REQUIRED_QUICK_SCAN_KEYS, type ItemDef } from './items';
import { deriveArchetype } from './archetype';
import {
  DOMAINS,
  ENGINE_VERSION,
  type Answers,
  type Band,
  type DepthInputs,
  type DimensionResult,
  type Domain,
  type LayerOverrides,
  type MeasuredDomain,
  type NormTable,
  type SoulProfile,
  type TraitResult,
  type TraitSource,
} from './types';

export const THEORETICAL_NORMS_VERSION = 'theoretical-1';

/** Likert mean (1–5) → 0–100. */
export const toScore = (mean: number): number => Math.round(((mean - 1) / 4) * 100);

export function bandFor(score: number | null, domain: Domain | null, norms?: NormTable): Band | null {
  if (score === null) return null;
  const table = domain ? norms?.percentiles[domain] : undefined;
  if (table && table.length === 101) {
    const pct = percentileOf(score, table);
    return pct < 30 ? 'low' : pct > 70 ? 'high' : 'balanced';
  }
  return score < 35 ? 'low' : score > 65 ? 'high' : 'balanced';
}

/** Highest percentile p whose norm score is ≤ score. */
export function percentileOf(score: number, table: number[]): number {
  let p = 0;
  for (let i = 0; i < table.length; i++) if ((table[i] as number) <= score) p = i;
  return p;
}

const likertValue = (answers: Answers, item: ItemDef): number | null => {
  const v = answers[item.key]?.value;
  if (typeof v !== 'number') return null;
  return item.keyed === -1 ? 6 - v : v;
};

const MIN_ANSWERED_RATIO = 0.5;

function scoreDomain(answers: Answers, domain: MeasuredDomain, flagged: boolean): DimensionResult {
  const items = QUICK_SCAN_ITEMS.filter((i) => i.domain === domain);
  const values = items.map((i) => likertValue(answers, i)).filter((v): v is number => v !== null);
  const ratio = values.length / items.length;
  if (values.length === 0 || ratio < MIN_ANSWERED_RATIO) {
    return { score: null, band: null, confidence: ratio, source: 'quick_scan' };
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return { score: toScore(mean), band: null, confidence: round2(ratio * (flagged ? 0.7 : 1)), source: 'quick_scan' };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** ENG-006: positively and reverse keyed items both answered at the same extreme. */
export function consistencyFlags(answers: Answers): MeasuredDomain[] {
  const flags: MeasuredDomain[] = [];
  for (const [a, b, domain] of CONSISTENCY_PAIRS) {
    const va = answers[a]?.value;
    const vb = answers[b]?.value;
    if (typeof va === 'number' && typeof vb === 'number' && va === vb && (va === 1 || va === 5)) flags.push(domain);
  }
  return flags;
}

/** ENG-006: ≥ 90% identical answers in block A (needs at least 10 answers). */
export function isStraightLining(answers: Answers): boolean {
  const values = QUICK_SCAN_ITEMS.filter((i) => i.block === 'A')
    .map((i) => answers[i.key]?.value)
    .filter((v): v is number => typeof v === 'number');
  if (values.length < 10) return false;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return Math.max(...counts.values()) / values.length >= 0.9;
}

export function depthOf(quickScanComplete: boolean, d: DepthInputs): number {
  const quick = quickScanComplete ? 40 : 0;
  const deep = Math.min(4, Math.max(0, d.deepPartsCompleted)) * 7.5;
  const insights = Math.min(15, Math.max(0, d.keptInsights) * 3);
  const levels = Math.min(2, Math.max(0, d.extraLevelsCompleted)) * 7.5;
  return Math.round(quick + deep + insights + levels);
}

/**
 * Resolves a categorical/numeric layer trait: the most recent user-confirmed value wins (SOUL-005).
 */
function resolve<T>(
  traitKey: string,
  fromAnswer: { value: T | null; at: string | null },
  overrides: LayerOverrides | undefined,
  parse: (v: unknown) => T | null,
): { value: T | null; source: TraitSource } {
  const ov = overrides?.[traitKey];
  const ovValue = ov ? parse(ov.value) : null;
  if (ov && ovValue !== null && (fromAnswer.value === null || fromAnswer.at === null || ov.updatedAt > fromAnswer.at)) {
    return { value: ovValue, source: ov.source };
  }
  return { value: fromAnswer.value, source: 'quick_scan' };
}

function itemForTrait(trait: string): ItemDef {
  const item = QUICK_SCAN_ITEMS.find((i) => i.trait === trait);
  if (!item) throw new Error(`No item for trait ${trait}`);
  return item;
}

function optionKeys(item: ItemDef): Set<string> {
  return new Set(item.options?.map((o) => o.key) ?? []);
}

function categorical<T extends string>(answers: Answers, trait: string, overrides?: LayerOverrides): TraitResult<T> {
  const item = itemForTrait(trait);
  const keys = optionKeys(item);
  const parse = (v: unknown): T | null => (typeof v === 'string' && keys.has(v) ? (v as T) : null);
  const a = answers[item.key];
  return resolve<T>(trait, { value: parse(a?.value), at: a?.answeredAt ?? null }, overrides, parse);
}

function multiple<T extends string>(answers: Answers, trait: string, overrides?: LayerOverrides): TraitResult<T[]> {
  const item = itemForTrait(trait);
  const keys = optionKeys(item);
  const parse = (v: unknown): T[] | null => {
    if (!Array.isArray(v) || v.length === 0) return null;
    const clean = [...new Set(v.filter((x): x is string => typeof x === 'string' && keys.has(x)))].sort();
    return clean.length ? (clean as T[]) : null;
  };
  const a = answers[item.key];
  return resolve<T[]>(trait, { value: parse(a?.value), at: a?.answeredAt ?? null }, overrides, parse);
}

function numeric(answers: Answers, trait: string, overrides?: LayerOverrides): DimensionResult {
  const item = itemForTrait(trait);
  const a = answers[item.key];
  const fromAnswer = typeof a?.value === 'number' ? toScore(a.value) : null;
  const parse = (v: unknown): number | null =>
    typeof v === 'number' && v >= 0 && v <= 100 ? Math.round(v) : null;
  const r = resolve<number>(trait, { value: fromAnswer, at: a?.answeredAt ?? null }, overrides, parse);
  return { score: r.value, band: bandFor(r.value, null), confidence: r.value === null ? 0 : 1, source: r.source };
}

export interface ScoreOptions {
  overrides?: LayerOverrides;
  norms?: NormTable;
  depth?: DepthInputs;
}

/** ENG-005: main entry point. Same inputs ⇒ identical output. */
export function scoreProfile(answers: Answers, opts: ScoreOptions = {}): SoulProfile {
  const flags = consistencyFlags(answers);
  const straight = isStraightLining(answers);
  const measured = (d: MeasuredDomain) => {
    const r = scoreDomain(answers, d, flags.includes(d));
    return straight ? { ...r, confidence: round2(r.confidence * 0.7) } : r;
  };
  const n = measured('N');
  const raw: Record<Domain, DimensionResult> = {
    O: measured('O'),
    C: measured('C'),
    E: measured('E'),
    A: measured('A'),
    S: { ...n, score: n.score === null ? null : 100 - n.score },
  };
  const domains = Object.fromEntries(
    DOMAINS.map((d) => [d, { ...raw[d], band: bandFor(raw[d].score, d, opts.norms) }]),
  ) as Record<Domain, DimensionResult>;

  const quickScanComplete = REQUIRED_QUICK_SCAN_KEYS.every((k) => answers[k] !== undefined);
  const ov = opts.overrides;
  const dealItem = ITEMS_BY_KEY.get('deal_01');
  const dealValue = answers['deal_01']?.value;
  const dealKeys = dealItem ? optionKeys(dealItem) : new Set<string>();
  const dealbreakers = Array.isArray(dealValue)
    ? [...new Set(dealValue.filter((v): v is string => dealKeys.has(v)))].sort()
    : [];

  const profileWithoutArchetype = {
    engineVersion: ENGINE_VERSION,
    normsVersion: opts.norms?.version ?? THEORETICAL_NORMS_VERSION,
    domains,
    relationship: {
      closeness_comfort: numeric(answers, 'closeness_comfort', ov),
      reassurance_need: numeric(answers, 'reassurance_need', ov),
      independence_need: numeric(answers, 'independence_need', ov),
      affection_expression: numeric(answers, 'affection_expression', ov),
      conflict_style: categorical(answers, 'conflict_style', ov),
      care_language: multiple(answers, 'care_language', ov),
    },
    values: {
      values: multiple(answers, 'values', ov),
      kids_plan: categorical(answers, 'kids_plan', ov),
      life_direction: categorical(answers, 'life_direction', ov),
    },
    lifestyle: {
      weekend_style: categorical(answers, 'weekend_style', ov),
      spontaneity: numeric(answers, 'spontaneity', ov),
      activity_level: categorical(answers, 'activity_level', ov),
      smoking: categorical(answers, 'smoking', ov),
      drinking: categorical(answers, 'drinking', ov),
    },
    communication: {
      texting_rhythm: categorical(answers, 'texting_rhythm', ov),
      conversation_depth: numeric(answers, 'conversation_depth', ov),
    },
    dealbreakers,
    quality: { consistencyFlags: flags.map((d) => (d === 'N' ? 'S' : d)) as Domain[], straightLining: straight },
    depth: depthOf(quickScanComplete, opts.depth ?? { deepPartsCompleted: 0, keptInsights: 0, extraLevelsCompleted: 0 }),
    quickScanComplete,
  } as Omit<SoulProfile, 'archetype'>;

  return { ...profileWithoutArchetype, archetype: deriveArchetype(domains) } as SoulProfile;
}
