/**
 * Soul Engine types (PRD 08-soul-engine). Pure data, no I/O.
 */

export const ENGINE_VERSION = '2.1.0';

export type Domain = 'O' | 'C' | 'E' | 'A' | 'S';
/** Neuroticism is measured by items but only Emotional Stability (S = 100 − N) is exposed. */
export type MeasuredDomain = 'O' | 'C' | 'E' | 'A' | 'N';
export const DOMAINS: readonly Domain[] = ['O', 'C', 'E', 'A', 'S'];

export type Band = 'low' | 'balanced' | 'high';
export type TraitSource = 'quick_scan' | 'deep' | 'level3' | 'level4' | 'soul_talk' | 'user_edit';

export type Intent = 'long_term' | 'open_to_long' | 'casual' | 'not_sure';
export type Gender = 'woman' | 'man' | 'non_binary';

export type ConflictStyle = 'talk_now' | 'cool_down_then_talk' | 'let_it_go';
export type CareLanguage = 'words' | 'time' | 'help' | 'gifts' | 'touch';
export type Value =
  | 'family' | 'career' | 'adventure' | 'stability' | 'growth'
  | 'creativity' | 'health' | 'faith' | 'freedom' | 'community';
export type KidsPlan = 'have_want_more' | 'have_no_more' | 'want' | 'dont_want' | 'open' | 'not_sure';
export type LifeDirection = 'settle_build' | 'grow_career' | 'explore_world' | 'balance_all';
export type WeekendStyle = 'cozy_home' | 'outdoors_active' | 'social_out' | 'culture_explore' | 'mix';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type Smoking = 'never' | 'socially' | 'regularly';
export type Drinking = 'never' | 'rarely' | 'socially' | 'often';
export type TextingRhythm = 'all_day' | 'few_times_day' | 'daily_checkin' | 'prefer_meeting';
export type Dealbreaker = 'smoker' | 'heavy_drinker' | 'wants_kids' | 'doesnt_want_kids' | 'has_kids';

export type ArchetypeKey =
  | 'architect' | 'explorer' | 'dreamer' | 'free_spirit' | 'captain'
  | 'guardian' | 'anchor' | 'sunshine' | 'adventurer' | 'peacemaker'
  | 'single_O' | 'single_C' | 'single_E' | 'single_A' | 'single_S'
  | 'harmonizer';

/** A numeric (0–100) dimension result. */
export interface DimensionResult {
  score: number | null;
  band: Band | null;
  confidence: number;
  source: TraitSource;
}

/** A categorical trait result. `value` is null when unknown. */
export interface TraitResult<T> {
  value: T | null;
  source: TraitSource;
}

export interface RelationshipLayer {
  closeness_comfort: DimensionResult;
  reassurance_need: DimensionResult;
  independence_need: DimensionResult;
  affection_expression: DimensionResult;
  conflict_style: TraitResult<ConflictStyle>;
  care_language: TraitResult<CareLanguage[]>;
}

export interface ValuesLayer {
  values: TraitResult<Value[]>;
  kids_plan: TraitResult<KidsPlan>;
  life_direction: TraitResult<LifeDirection>;
}

export interface LifestyleLayer {
  weekend_style: TraitResult<WeekendStyle>;
  spontaneity: DimensionResult;
  activity_level: TraitResult<ActivityLevel>;
  smoking: TraitResult<Smoking>;
  drinking: TraitResult<Drinking>;
}

export interface CommunicationLayer {
  texting_rhythm: TraitResult<TextingRhythm>;
  conversation_depth: DimensionResult;
}

export interface ProfileQuality {
  consistencyFlags: Domain[];
  straightLining: boolean;
}

export interface SoulProfile {
  engineVersion: string;
  normsVersion: string;
  domains: Record<Domain, DimensionResult>;
  /** 29 facets after Deep Personality (N facets stored inverted as S1–S6). Missing until answered. */
  facets: Record<string, DimensionResult>;
  /** Number of Deep Personality parts fully answered (0–4). */
  deepPartsCompleted: number;
  relationship: RelationshipLayer;
  values: ValuesLayer;
  lifestyle: LifestyleLayer;
  communication: CommunicationLayer;
  dealbreakers: Dealbreaker[];
  quality: ProfileQuality;
  /** 0–100, see ENG-006. */
  depth: number;
  archetype: ArchetypeKey;
  quickScanComplete: boolean;
}

export type AnswerValue = number | string | string[] | null;

export interface Answer {
  value: AnswerValue;
  /** ISO timestamp. Used to resolve conflicts with layer overrides (SOUL-005). */
  answeredAt: string;
}

export type Answers = Record<string, Answer>;

/** User-confirmed layer trait values (user edits or kept Soul Talk insights). */
export interface LayerOverride {
  value: string | string[] | number;
  updatedAt: string;
  source: 'user_edit' | 'soul_talk';
}
export type LayerOverrides = Record<string, LayerOverride>;

export interface NormTable {
  version: string;
  /** For each domain: 101 ascending scores, index = percentile 0..100. */
  percentiles: Partial<Record<Domain, number[]>>;
}

export interface DepthInputs {
  deepPartsCompleted?: number;
  keptInsights: number;
  extraLevelsCompleted: number;
}
