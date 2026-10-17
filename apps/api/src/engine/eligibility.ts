/**
 * ENG-011: hard eligibility filters. Applied before scoring. The service layer mirrors these
 * in SQL for performance; this function is the reference implementation used in tests and as a
 * final in-memory check.
 */
import { intentsCompatible } from './match-config';
import type { Dealbreaker, Drinking, Gender, Intent, KidsPlan, Smoking } from './types';

export interface EligibilitySubject {
  status: 'onboarding' | 'active' | 'suspended' | 'blocked_underage' | 'deletion_requested' | 'deleted';
  ageGatePassed: boolean;
  onboardingComplete: boolean;
  quickScanComplete: boolean;
  photoCount: number;
  discoveryEnabled: boolean;
  openToMeet: boolean;
  hiddenByModeration: boolean;
  gender: Gender;
  interestedIn: Gender[];
  age: number;
  ageMin: number;
  ageMax: number;
  intent: Intent;
  dealbreakers: Dealbreaker[];
  smoking: Smoking | null;
  drinking: Drinking | null;
  kidsPlan: KidsPlan | null;
}

export interface PairContext {
  mode: 'daily' | 'nearby';
  blockedEitherWay: boolean;
  previouslyMatched: boolean;
  /** Viewer passed on the candidate within PASS_COOLDOWN_DAYS. */
  passedRecently: boolean;
}

export type IneligibleReason =
  | 'INACTIVE' | 'AGE_GATE' | 'ONBOARDING' | 'QUICK_SCAN' | 'PHOTOS' | 'NOT_DISCOVERABLE'
  | 'NOT_OPEN' | 'MODERATION' | 'GENDER_PREF' | 'AGE_RANGE' | 'INTENT' | 'BLOCKED'
  | 'PREVIOUS_MATCH' | 'PASSED' | 'DEALBREAKER' | 'SELF';

export type EligibilityResult = { eligible: true } | { eligible: false; reason: IneligibleReason };

/** One clear photo is enough (founder decision 2026-10-17, CR-14). */
const MIN_PHOTOS = 1;

/** Why this person can't take part in discovery right now (null = ready). Applies to viewer and candidate alike. */
export function readyForDating(s: EligibilitySubject, mode: PairContext['mode']): IneligibleReason | null {
  if (s.status !== 'active') return 'INACTIVE';
  if (!s.ageGatePassed) return 'AGE_GATE';
  if (!s.onboardingComplete) return 'ONBOARDING';
  if (!s.quickScanComplete) return 'QUICK_SCAN';
  if (s.photoCount < MIN_PHOTOS) return 'PHOTOS';
  if (s.hiddenByModeration) return 'MODERATION';
  if (mode === 'daily' && !s.discoveryEnabled) return 'NOT_DISCOVERABLE';
  if (mode === 'nearby' && !s.openToMeet) return 'NOT_OPEN';
  return null;
}

/** True if `other` triggers any of `holder`'s dealbreakers. */
export function violatesDealbreakers(holder: EligibilitySubject, other: EligibilitySubject): boolean {
  return holder.dealbreakers.some((d) => {
    switch (d) {
      case 'smoker':
        return other.smoking === 'regularly';
      case 'heavy_drinker':
        return other.drinking === 'often';
      case 'wants_kids':
        return other.kidsPlan === 'want' || other.kidsPlan === 'have_want_more';
      case 'doesnt_want_kids':
        return other.kidsPlan === 'dont_want';
      case 'has_kids':
        return other.kidsPlan === 'have_want_more' || other.kidsPlan === 'have_no_more';
    }
  });
}

/** Symmetric by construction: every rule is checked both ways. */
export function eligibility(
  a: EligibilitySubject & { id: string },
  b: EligibilitySubject & { id: string },
  ctx: PairContext,
): EligibilityResult {
  const no = (reason: IneligibleReason): EligibilityResult => ({ eligible: false, reason });
  if (a.id === b.id) return no('SELF');
  const readyA = readyForDating(a, ctx.mode);
  if (readyA) return no(readyA);
  const readyB = readyForDating(b, ctx.mode);
  if (readyB) return no(readyB);
  if (!a.interestedIn.includes(b.gender) || !b.interestedIn.includes(a.gender)) return no('GENDER_PREF');
  if (b.age < a.ageMin || b.age > a.ageMax || a.age < b.ageMin || a.age > b.ageMax) return no('AGE_RANGE');
  if (!intentsCompatible(a.intent, b.intent)) return no('INTENT');
  if (ctx.blockedEitherWay) return no('BLOCKED');
  if (ctx.previouslyMatched) return no('PREVIOUS_MATCH');
  if (ctx.passedRecently) return no('PASSED');
  if (violatesDealbreakers(a, b) || violatesDealbreakers(b, a)) return no('DEALBREAKER');
  return { eligible: true };
}
