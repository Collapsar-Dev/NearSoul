/**
 * Default match_config v2 (PRD §8.8). In production the active config is loaded from the
 * `match_config` table; this object is the seed and the test fixture. Code holds only formulas.
 */
import type { Intent } from './types';

export interface MatchConfig {
  version: string;
  layerWeights: { values: number; relationship: number; lifestyle: number; communication: number; personality: number };
  inner: {
    values: { values: number; kids_plan: number; life_direction: number };
    relationship: {
      closeness_comfort: number; independence_need: number; reassurance_fit: number;
      conflict_style: number; care_language: number;
    };
    lifestyle: { weekend_style: number; spontaneity: number; activity_level: number; smoking: number; drinking: number };
    communication: { texting_rhythm: number; conversation_depth: number };
    personality: { O: number; C: number; E: number; A: number; S: number };
  };
  tables: {
    /** Unordered pair key "a|b" (sorted) → similarity. */
    conflict_style: Record<string, number>;
    life_direction: { same: number; balanceAny: number; other: number };
    weekend_style: { same: number; mixAny: number; other: number };
    care_language: { overlap: number; none: number };
    kids: { same: number; openAny: number; conflict: number };
  };
  intentMultiplier: { same: number; other: number };
  tiers: { strong: number; good: number; some: number };
  nearbyMinScore: number;
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
  version: 'v2.0',
  layerWeights: { values: 0.3, relationship: 0.25, lifestyle: 0.15, communication: 0.15, personality: 0.15 },
  inner: {
    values: { values: 0.5, kids_plan: 0.3, life_direction: 0.2 },
    relationship: { closeness_comfort: 0.25, independence_need: 0.25, reassurance_fit: 0.2, conflict_style: 0.2, care_language: 0.1 },
    lifestyle: { weekend_style: 0.25, spontaneity: 0.25, activity_level: 0.2, smoking: 0.15, drinking: 0.15 },
    communication: { texting_rhythm: 0.5, conversation_depth: 0.5 },
    personality: { O: 0.25, C: 0.2, E: 0.15, A: 0.2, S: 0.2 },
  },
  tables: {
    conflict_style: {
      'cool_down_then_talk|talk_now': 0.6,
      'let_it_go|talk_now': 0.2,
      'cool_down_then_talk|let_it_go': 0.5,
    },
    life_direction: { same: 1, balanceAny: 0.6, other: 0.2 },
    weekend_style: { same: 1, mixAny: 0.6, other: 0.2 },
    care_language: { overlap: 1, none: 0.4 },
    kids: { same: 1, openAny: 0.5, conflict: 0 },
  },
  intentMultiplier: { same: 1, other: 0.92 },
  tiers: { strong: 75, good: 55, some: 35 },
  nearbyMinScore: 55,
};

/** PRD §8.7: allowed intent pairs. */
const INTENT_BLOCKED = new Set(['casual|long_term']);
export function intentsCompatible(a: Intent, b: Intent): boolean {
  return !INTENT_BLOCKED.has(pairKey(a, b));
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
