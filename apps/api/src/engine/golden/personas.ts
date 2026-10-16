/**
 * Golden personas for engine review (ENG-012 AC). Hand-made, varied, plausible people. The founder reviews
 * docs/engine/golden-pairs.md (generated) and approves the tiers before beta; a snapshot test locks the results.
 */
import { QUICK_SCAN_ITEMS } from '../items';
import type { Answers, AnswerValue, Intent } from '../types';

type Level = 1 | 2 | 3 | 4 | 5;

export interface Persona {
  key: string;
  name: string;
  story: string;
  intent: Intent;
  interests: string[];
  /** Big Five levels 1–5 (N = neuroticism; low N = steady). */
  big5: { O: Level; C: Level; E: Level; A: Level; N: Level };
  answers: Record<string, AnswerValue>;
}

export const PERSONAS: Persona[] = [
  { key: 'mia', name: 'Mia, 28 — curious traveller', story: 'Designer, loves trips and museums, talks deep, plans loosely.', intent: 'open_to_long', interests: ['travel', 'museums', 'coffee', 'photography'],
    big5: { O: 5, C: 2, E: 4, A: 4, N: 3 }, answers: { rel_01: 4, rel_02: 3, rel_03: 3, rel_04: 'talk_now', rel_05: ['time', 'words'], rel_06: 4, val_01: ['adventure', 'creativity', 'growth'], val_02: 'open', val_03: 'explore_world', life_01: 'culture_explore', life_02: 4, life_03: 'moderate', life_04: 'never', life_05: 'socially', com_01: 'few_times_day', com_02: 5 } },
  { key: 'leo', name: 'Leo, 31 — fellow explorer', story: 'Photographer, backpacker, spontaneous, deep talker.', intent: 'open_to_long', interests: ['travel', 'photography', 'hiking', 'coffee'],
    big5: { O: 5, C: 2, E: 4, A: 3, N: 2 }, answers: { rel_01: 4, rel_02: 3, rel_03: 3, rel_04: 'talk_now', rel_05: ['time'], rel_06: 4, val_01: ['adventure', 'freedom', 'growth'], val_02: 'open', val_03: 'explore_world', life_01: 'outdoors_active', life_02: 5, life_03: 'high', life_04: 'never', life_05: 'socially', com_01: 'few_times_day', com_02: 5 } },
  { key: 'anna', name: 'Anna, 33 — steady homemaker', story: 'Teacher, wants family soon, loves routines and cozy evenings.', intent: 'long_term', interests: ['cooking', 'books', 'gardening', 'pets'],
    big5: { O: 3, C: 5, E: 2, A: 5, N: 2 }, answers: { rel_01: 5, rel_02: 4, rel_03: 2, rel_04: 'cool_down_then_talk', rel_05: ['help', 'time'], rel_06: 4, val_01: ['family', 'stability', 'health'], val_02: 'want', val_03: 'settle_build', life_01: 'cozy_home', life_02: 1, life_03: 'moderate', life_04: 'never', life_05: 'rarely', com_01: 'daily_checkin', com_02: 4 } },
  { key: 'tom', name: 'Tom, 35 — reliable planner', story: 'Engineer, wants kids, organised, calm, a bit reserved.', intent: 'long_term', interests: ['cooking', 'cycling', 'books', 'board_games'],
    big5: { O: 3, C: 5, E: 2, A: 4, N: 1 }, answers: { rel_01: 5, rel_02: 3, rel_03: 2, rel_04: 'cool_down_then_talk', rel_05: ['help'], rel_06: 3, val_01: ['family', 'stability', 'career'], val_02: 'want', val_03: 'settle_build', life_01: 'cozy_home', life_02: 2, life_03: 'moderate', life_04: 'never', life_05: 'rarely', com_01: 'daily_checkin', com_02: 4 } },
  { key: 'zoe', name: 'Zoe, 26 — party starter', story: 'Event manager, social butterfly, texts all day, light and playful.', intent: 'casual', interests: ['nightlife', 'festivals', 'dancing', 'karaoke'],
    big5: { O: 3, C: 2, E: 5, A: 4, N: 3 }, answers: { rel_01: 3, rel_02: 4, rel_03: 2, rel_04: 'talk_now', rel_05: ['words', 'touch'], rel_06: 5, val_01: ['freedom', 'community', 'adventure'], val_02: 'not_sure', val_03: 'balance_all', life_01: 'social_out', life_02: 5, life_03: 'high', life_04: 'socially', life_05: 'often', com_01: 'all_day', com_02: 1 } },
  { key: 'max', name: 'Max, 29 — quiet thinker', story: 'Researcher, introvert, needs space, deep one-to-one talks.', intent: 'open_to_long', interests: ['books', 'science', 'philosophy', 'chess'],
    big5: { O: 5, C: 4, E: 1, A: 3, N: 3 }, answers: { rel_01: 3, rel_02: 2, rel_03: 5, rel_04: 'cool_down_then_talk', rel_05: ['time'], rel_06: 2, val_01: ['growth', 'freedom', 'career'], val_02: 'not_sure', val_03: 'grow_career', life_01: 'cozy_home', life_02: 2, life_03: 'low', life_04: 'never', life_05: 'rarely', com_01: 'prefer_meeting', com_02: 5 } },
  { key: 'sara', name: 'Sara, 30 — warm and anxious', story: 'Nurse, very caring, needs reassurance, feels deeply.', intent: 'long_term', interests: ['yoga', 'cooking', 'cinema', 'pets'],
    big5: { O: 3, C: 3, E: 3, A: 5, N: 5 }, answers: { rel_01: 5, rel_02: 5, rel_03: 1, rel_04: 'talk_now', rel_05: ['words', 'time'], rel_06: 5, val_01: ['family', 'health', 'community'], val_02: 'want', val_03: 'settle_build', life_01: 'mix', life_02: 3, life_03: 'moderate', life_04: 'never', life_05: 'socially', com_01: 'all_day', com_02: 4 } },
  { key: 'ivan', name: 'Ivan, 34 — independent adventurer', story: 'Pilot, loves freedom and sport, does not want kids, avoids talking conflicts through.', intent: 'not_sure', interests: ['climbing', 'travel', 'running', 'tech'],
    big5: { O: 4, C: 3, E: 3, A: 2, N: 2 }, answers: { rel_01: 2, rel_02: 1, rel_03: 5, rel_04: 'let_it_go', rel_05: ['help'], rel_06: 2, val_01: ['freedom', 'adventure', 'career'], val_02: 'dont_want', val_03: 'explore_world', life_01: 'outdoors_active', life_02: 4, life_03: 'very_high', life_04: 'never', life_05: 'socially', com_01: 'prefer_meeting', com_02: 3 } },
  { key: 'nina', name: 'Nina, 27 — creative free spirit', story: 'Musician, spontaneous, artsy, open to anything.', intent: 'open_to_long', interests: ['music', 'concerts', 'art', 'travel'],
    big5: { O: 5, C: 1, E: 4, A: 4, N: 3 }, answers: { rel_01: 4, rel_02: 3, rel_03: 4, rel_04: 'talk_now', rel_05: ['words', 'gifts'], rel_06: 5, val_01: ['creativity', 'freedom', 'adventure'], val_02: 'open', val_03: 'explore_world', life_01: 'culture_explore', life_02: 5, life_03: 'moderate', life_04: 'socially', life_05: 'socially', com_01: 'few_times_day', com_02: 4 } },
  { key: 'david', name: 'David, 38 — career-driven dad', story: 'Lawyer with a child, ambitious, wants stability, no more kids.', intent: 'long_term', interests: ['running', 'wine', 'history', 'tennis'],
    big5: { O: 3, C: 5, E: 3, A: 3, N: 2 }, answers: { rel_01: 4, rel_02: 2, rel_03: 4, rel_04: 'cool_down_then_talk', rel_05: ['help', 'gifts'], rel_06: 3, val_01: ['career', 'family', 'stability'], val_02: 'have_no_more', val_03: 'grow_career', life_01: 'mix', life_02: 2, life_03: 'high', life_04: 'never', life_05: 'socially', com_01: 'daily_checkin', com_02: 3 } },
];

/** Turns a persona into full Quick Scan answers (Mini-IPIP from Big Five levels; reverse-keyed items mirrored). */
export function personaAnswers(p: Persona, at = '2026-10-01T10:00:00.000Z'): Answers {
  const out: Answers = {};
  for (const item of QUICK_SCAN_ITEMS) {
    if (item.block !== 'A' || !item.domain) continue;
    const lvl = p.big5[item.domain];
    out[item.key] = { value: item.keyed === 1 ? lvl : 6 - lvl, answeredAt: at };
  }
  for (const [k, v] of Object.entries(p.answers)) out[k] = { value: v, answeredAt: at };
  return out;
}

export const GOLDEN_PAIRS: [string, string][] = [
  ['mia', 'leo'], ['anna', 'tom'], ['mia', 'nina'], ['leo', 'nina'], ['sara', 'tom'],
  ['anna', 'david'], ['tom', 'david'], ['max', 'mia'], ['max', 'anna'], ['sara', 'ivan'],
  ['zoe', 'leo'], ['zoe', 'nina'], ['zoe', 'max'], ['ivan', 'leo'], ['ivan', 'anna'],
  ['david', 'sara'], ['nina', 'ivan'], ['max', 'ivan'], ['mia', 'tom'], ['zoe', 'anna'],
];
