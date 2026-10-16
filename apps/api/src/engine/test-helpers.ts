/** Test helpers for the engine (excluded from coverage via *.spec naming in callers). */
import fc from 'fast-check';
import { QUICK_SCAN_ITEMS, type ItemDef } from './items';
import { scoreProfile } from './scoring';
import type { Answers, AnswerValue, SoulProfile } from './types';

export const AT = '2026-10-01T10:00:00.000Z';

/** Builds answers: Big Five items default to 3, others to their first option, overridable. */
export function answers(overrides: Record<string, AnswerValue> = {}): Answers {
  const out: Answers = {};
  for (const item of QUICK_SCAN_ITEMS) {
    if (item.optional) continue;
    out[item.key] = { value: defaultValue(item), answeredAt: AT };
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete out[k];
    else out[k] = { value: v, answeredAt: AT };
  }
  return out;
}

/**
 * Varied Block A defaults: every domain still averages exactly 3 (score 50) after reverse keys,
 * but the raw answers are not straight-lined.
 */
const BLOCK_A_DEFAULTS: Record<string, number> = {
  mi_01: 4, mi_06: 2, mi_11: 2, mi_16: 4, // E
  mi_02: 4, mi_07: 2, mi_12: 2, mi_17: 4, // A
  mi_03: 4, mi_08: 2, mi_13: 2, mi_18: 4, // C
  mi_04: 4, mi_09: 2, mi_14: 2, mi_19: 4, // N
  mi_05: 3, mi_10: 2, mi_15: 4, mi_20: 3, // O
};

function defaultValue(item: ItemDef): AnswerValue {
  if (item.type === 'likert5') return BLOCK_A_DEFAULTS[item.key] ?? 3;
  const opts = item.options?.map((o) => o.key) ?? [];
  if (item.type === 'single') return opts[0] ?? null;
  return opts.slice(0, item.minSelect ?? 1);
}

/** Sets all four Mini-IPIP items of a domain so the domain scores `high` or `low`. */
export function domainAnswers(domain: 'O' | 'C' | 'E' | 'A' | 'N', level: 'high' | 'low'): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of QUICK_SCAN_ITEMS.filter((i) => i.domain === domain)) {
    const positive = item.keyed === 1;
    out[item.key] = level === 'high' ? (positive ? 5 : 1) : positive ? 1 : 5;
  }
  return out;
}

export const profile = (overrides: Record<string, AnswerValue> = {}): SoulProfile => scoreProfile(answers(overrides));

/** fast-check arbitrary producing a random (possibly partial) answer set. */
export const arbAnswers: fc.Arbitrary<Answers> = fc
  .tuple(...QUICK_SCAN_ITEMS.map((item) => fc.option(arbValue(item), { nil: undefined, freq: 6 })))
  .map((vals) => {
    const out: Answers = {};
    QUICK_SCAN_ITEMS.forEach((item, i) => {
      const v = vals[i];
      if (v !== undefined) out[item.key] = { value: v, answeredAt: AT };
    });
    return out;
  });

function arbValue(item: ItemDef): fc.Arbitrary<AnswerValue> {
  const opts = item.options?.map((o) => o.key) ?? [];
  if (item.type === 'likert5') return fc.integer({ min: 1, max: 5 });
  if (item.type === 'single') return fc.constantFrom(...opts);
  return fc.subarray(opts, { minLength: item.minSelect ?? 0, maxLength: item.maxSelect ?? opts.length });
}

export const arbProfile: fc.Arbitrary<SoulProfile> = arbAnswers.map((a) => scoreProfile(a));
