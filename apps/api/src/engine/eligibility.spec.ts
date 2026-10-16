import { eligibility, violatesDealbreakers, type EligibilitySubject, type PairContext } from './eligibility';

const base = (over: Partial<EligibilitySubject & { id: string }> = {}): EligibilitySubject & { id: string } => ({
  id: 'a', status: 'active', ageGatePassed: true, onboardingComplete: true, quickScanComplete: true, photoCount: 2,
  discoveryEnabled: true, openToMeet: true, hiddenByModeration: false, gender: 'woman', interestedIn: ['man'],
  age: 28, ageMin: 25, ageMax: 35, intent: 'long_term', dealbreakers: [], smoking: 'never', drinking: 'socially',
  kidsPlan: 'want', ...over,
});
const A = base();
const B = base({ id: 'b', gender: 'man', interestedIn: ['woman'], age: 30 });
const ctx = (over: Partial<PairContext> = {}): PairContext => ({ mode: 'daily', blockedEitherWay: false, previouslyMatched: false, passedRecently: false, ...over });

describe('eligibility (ENG-011)', () => {
  it('eligible baseline, both directions', () => {
    expect(eligibility(A, B, ctx())).toEqual({ eligible: true });
    expect(eligibility(B, A, ctx())).toEqual({ eligible: true });
  });

  it.each<[string, Partial<EligibilitySubject>, string]>([
    ['inactive', { status: 'suspended' }, 'INACTIVE'],
    ['no age gate', { ageGatePassed: false }, 'AGE_GATE'],
    ['onboarding', { onboardingComplete: false }, 'ONBOARDING'],
    ['quick scan', { quickScanComplete: false }, 'QUICK_SCAN'],
    ['photos', { photoCount: 1 }, 'PHOTOS'],
    ['moderation', { hiddenByModeration: true }, 'MODERATION'],
    ['discovery off', { discoveryEnabled: false }, 'NOT_DISCOVERABLE'],
  ])('rejects candidate: %s', (_n, over, reason) => {
    expect(eligibility(A, { ...B, ...over }, ctx())).toEqual({ eligible: false, reason });
    expect(eligibility({ ...A, ...over }, B, ctx())).toEqual({ eligible: false, reason });
  });

  it('nearby mode requires both to be open to meet', () => {
    expect(eligibility(A, { ...B, openToMeet: false }, ctx({ mode: 'nearby' }))).toEqual({ eligible: false, reason: 'NOT_OPEN' });
    expect(eligibility(A, { ...B, discoveryEnabled: false }, ctx({ mode: 'nearby' }))).toEqual({ eligible: true });
  });

  it('gender preferences must fit both ways', () => {
    expect(eligibility(A, { ...B, interestedIn: ['man'] }, ctx())).toEqual({ eligible: false, reason: 'GENDER_PREF' });
    expect(eligibility({ ...A, interestedIn: ['woman'] }, B, ctx())).toEqual({ eligible: false, reason: 'GENDER_PREF' });
  });

  it('ages must be inside both ranges', () => {
    expect(eligibility(A, { ...B, age: 40 }, ctx())).toEqual({ eligible: false, reason: 'AGE_RANGE' });
    expect(eligibility(A, { ...B, ageMin: 30 }, ctx())).toEqual({ eligible: false, reason: 'AGE_RANGE' });
  });

  it('incompatible intents are filtered', () => {
    expect(eligibility(A, { ...B, intent: 'casual' }, ctx())).toEqual({ eligible: false, reason: 'INTENT' });
  });

  it.each<[keyof PairContext, string]>([
    ['blockedEitherWay', 'BLOCKED'], ['previouslyMatched', 'PREVIOUS_MATCH'], ['passedRecently', 'PASSED'],
  ])('context %s', (key, reason) => {
    expect(eligibility(A, B, ctx({ [key]: true }))).toEqual({ eligible: false, reason });
  });

  it('rejects self', () => {
    expect(eligibility(A, A, ctx())).toEqual({ eligible: false, reason: 'SELF' });
  });

  it('dealbreakers apply both ways', () => {
    expect(eligibility({ ...A, dealbreakers: ['smoker'] }, { ...B, smoking: 'regularly' }, ctx())).toEqual({ eligible: false, reason: 'DEALBREAKER' });
    expect(eligibility({ ...A, smoking: 'regularly' }, { ...B, dealbreakers: ['smoker'] }, ctx())).toEqual({ eligible: false, reason: 'DEALBREAKER' });
  });

  it.each<[string, Partial<EligibilitySubject>, boolean]>([
    ['smoker vs social smoker', { smoking: 'socially' }, false],
    ['heavy_drinker', { drinking: 'often' }, true],
    ['wants_kids', { kidsPlan: 'have_want_more' }, true],
    ['doesnt_want_kids', { kidsPlan: 'dont_want' }, true],
    ['has_kids', { kidsPlan: 'have_no_more' }, true],
  ])('dealbreaker mapping: %s', (name, otherOver, expected) => {
    const key = name.split(' ')[0] as EligibilitySubject['dealbreakers'][number];
    expect(violatesDealbreakers({ ...A, dealbreakers: [key] }, { ...B, kidsPlan: 'open', ...otherOver })).toBe(expected);
  });
});
