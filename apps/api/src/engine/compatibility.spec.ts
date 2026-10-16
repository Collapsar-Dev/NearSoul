import fc from 'fast-check';
import { compatibility, kidsSimilarity, level, ord, reassuranceFit, sim, tierFor, type CompatSubject } from './compatibility';
import { DEFAULT_MATCH_CONFIG, intentsCompatible } from './match-config';
import { scoreProfile } from './scoring';
import { answers, arbProfile, domainAnswers, profile } from './test-helpers';
import type { Intent, SoulProfile } from './types';

const subject = (p: SoulProfile, intent: Intent = 'long_term', interests: string[] = []): CompatSubject => ({ profile: p, intent, interests });
const arbIntent = fc.constantFrom<Intent>('long_term', 'open_to_long', 'casual', 'not_sure');
const arbSubject = fc.record({ profile: arbProfile, intent: arbIntent, interests: fc.subarray(['hiking', 'jazz', 'cooking', 'chess', 'yoga']) });

describe('helpers', () => {
  it('sim / level / ord', () => {
    expect(sim(30, 70)).toBeCloseTo(0.6);
    expect(level(80, 60)).toBeCloseTo(0.7);
    expect(ord(0, 3, 4)).toBe(0);
    expect(ord(1, 2, 4)).toBeCloseTo(2 / 3);
  });

  it('kids table', () => {
    const c = DEFAULT_MATCH_CONFIG;
    expect(kidsSimilarity('want', 'have_want_more', c)).toBe(1);
    expect(kidsSimilarity('dont_want', 'have_no_more', c)).toBe(1);
    expect(kidsSimilarity('want', 'dont_want', c)).toBe(0);
    expect(kidsSimilarity('open', 'dont_want', c)).toBe(0.5);
    expect(kidsSimilarity('want', 'not_sure', c)).toBe(0.5);
    expect(kidsSimilarity(null, 'want', c)).toBeNull();
  });

  it('reassurance fit penalizes high reassurance + high independence', () => {
    expect(reassuranceFit(50, 50, 50, 50)).toBe(1);
    expect(reassuranceFit(100, 0, 0, 100)).toBeCloseTo(0.5); // A needs reassurance, B needs space
    expect(reassuranceFit(100, 100, 100, 100)).toBe(0);
    expect(reassuranceFit(null, 50, 50, 50)).toBeNull();
  });

  it('intent matrix (§8.7)', () => {
    expect(intentsCompatible('long_term', 'casual')).toBe(false);
    expect(intentsCompatible('casual', 'long_term')).toBe(false);
    expect(intentsCompatible('long_term', 'not_sure')).toBe(true);
    expect(intentsCompatible('casual', 'open_to_long')).toBe(true);
  });

  it('tiers', () => {
    expect(tierFor(75)).toBe('strong');
    expect(tierFor(74)).toBe('good');
    expect(tierFor(55)).toBe('good');
    expect(tierFor(54)).toBe('some');
    expect(tierFor(35)).toBe('some');
    expect(tierFor(34)).toBe('low');
  });
});

describe('compatibility properties (ENG-012)', () => {
  it('is symmetric: score(A,B) = score(B,A)', () => {
    fc.assert(fc.property(arbSubject, arbSubject, (a, b) => {
      const ab = compatibility(a, b);
      const ba = compatibility(b, a);
      expect(ab.score).toBe(ba.score);
      expect(ab.layers).toEqual(ba.layers);
      expect(ab.confidence).toBe(ba.confidence);
      expect([...ab.frictions].sort()).toEqual([...ba.frictions].sort());
    }), { numRuns: 300 });
  });

  it('is bounded and deterministic', () => {
    fc.assert(fc.property(arbSubject, arbSubject, (a, b) => {
      const r = compatibility(a, b);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
      expect(compatibility(a, b)).toEqual(r);
    }), { numRuns: 300 });
  });

  it('unknown data never counts as a zero (removing a dimension is excluded, not penalized)', () => {
    const a = profile({ com_02: 5, life_02: 1 });
    const b = profile({ com_02: 1, life_02: 1 });
    const known = compatibility(subject(a), subject(b));
    const bUnknown = scoreProfile(answers({ com_02: undefined as never, life_02: 1 }));
    const unknown = compatibility(subject(a), subject(bUnknown));
    expect(unknown.layers.communication.confidence).toBeLessThan(1);
    // depth mismatch was a penalty; with depth unknown the communication layer can only go up
    expect(unknown.layers.communication.score!).toBeGreaterThanOrEqual(known.layers.communication.score!);
  });

  it('returns score 0 and low tier when nothing is known', () => {
    const empty = scoreProfile({});
    const r = compatibility(subject(empty), subject(empty));
    expect(r.score).toBe(0);
    expect(r.tier).toBe('low');
    expect(r.confidence).toBe(0);
  });
});

describe('compatibility examples', () => {
  const soulA = profile({
    ...domainAnswers('O', 'high'), ...domainAnswers('A', 'high'),
    val_01: ['adventure', 'growth', 'family'], val_02: 'want', val_03: 'explore_world',
    rel_04: 'cool_down_then_talk', rel_05: ['time', 'words'], com_01: 'daily_checkin', com_02: 5,
    life_01: 'outdoors_active', life_02: 4, life_03: 'high',
  });
  const soulB = profile({
    ...domainAnswers('O', 'high'), ...domainAnswers('A', 'high'),
    val_01: ['adventure', 'growth', 'health'], val_02: 'have_want_more', val_03: 'explore_world',
    rel_04: 'cool_down_then_talk', rel_05: ['time'], com_01: 'daily_checkin', com_02: 5,
    life_01: 'outdoors_active', life_02: 4, life_03: 'high',
  });
  const opposite = profile({
    ...domainAnswers('O', 'low'), ...domainAnswers('A', 'low'),
    val_01: ['career', 'stability', 'faith'], val_02: 'dont_want', val_03: 'grow_career',
    rel_01: 1, rel_02: 5, rel_03: 1, rel_04: 'let_it_go', rel_05: ['gifts'], com_01: 'all_day', com_02: 1,
    life_01: 'cozy_home', life_02: 1, life_03: 'low', life_04: 'regularly', life_05: 'often',
  });

  it('similar souls get a strong match with meaningful reasons', () => {
    const r = compatibility(subject(soulA, 'long_term', ['hiking']), subject(soulB, 'long_term', ['hiking', 'jazz']));
    expect(r.tier).toBe('strong');
    expect(r.reasons).toEqual(expect.arrayContaining([
      'SHARED_VALUE:adventure', 'SHARED_VALUE:growth', 'KIDS_ALIGNED', 'SAME_LIFE_DIRECTION', 'BOTH_DEEP_TALKERS',
      'SAME_TEXTING_RHYTHM', 'SAME_CONFLICT_STYLE', 'SHARED_CARE_LANGUAGE:time', 'SIMILAR_WEEKENDS:outdoors_active',
      'SIMILAR_PACE', 'SIMILAR_ACTIVITY', 'BOTH_CURIOUS', 'BOTH_WARM', 'SHARED_INTEREST:hiking', 'SAME_INTENT',
    ]));
    expect(r.frictions).toEqual([]);
  });

  it('opposites get a low score with frictions', () => {
    const r = compatibility(subject(soulA), subject(opposite, 'not_sure'));
    expect(r.score).toBeLessThan(35);
    expect(r.frictions).toEqual(expect.arrayContaining(['PACE_MISMATCH', 'DEPTH_GAP', 'DIFFERENT_DIRECTIONS', 'TEXTING_GAP', 'CONFLICT_STYLE_GAP']));
    expect(r.reasons).not.toContain('SAME_INTENT');
  });

  it('orders reasons by contribution (closeness+independence 0.125 > kids 0.09 > values)', () => {
    const r = compatibility(subject(soulA), subject(soulB));
    expect(r.reasons.slice(0, 2)).toEqual(['SIMILAR_CLOSENESS', 'KIDS_ALIGNED']);
  });

  it('applies the intent multiplier for different (allowed) intents', () => {
    const same = compatibility(subject(soulA, 'open_to_long'), subject(soulB, 'open_to_long'));
    const other = compatibility(subject(soulA, 'open_to_long'), subject(soulB, 'not_sure'));
    expect(Math.abs(other.score - same.score * 0.92)).toBeLessThanOrEqual(1);
    expect(other.score).toBeLessThan(same.score);
  });

  it('flags reassurance vs space and social energy gaps', () => {
    const clingy = profile({ rel_02: 5, rel_03: 1, ...domainAnswers('E', 'high') });
    const loner = profile({ rel_02: 1, rel_03: 5, ...domainAnswers('E', 'low') });
    const r = compatibility(subject(clingy), subject(loner));
    expect(r.frictions).toEqual(expect.arrayContaining(['SOCIAL_ENERGY_GAP', 'REASSURANCE_SPACE']));
    const close = profile({ rel_01: 5 });
    const distant = profile({ rel_01: 1 });
    expect(compatibility(subject(close), subject(distant)).frictions).toContain('CLOSENESS_GAP');
    const both = profile({ rel_02: 5, rel_03: 5 });
    expect(compatibility(subject(both), subject(both)).frictions).toContain('REASSURANCE_SPACE');
  });

  it('emits playful-talkers and similar-closeness reasons', () => {
    const p = profile({ com_02: 1, rel_01: 4, rel_03: 2 });
    const r = compatibility(subject(p), subject(p));
    expect(r.reasons).toEqual(expect.arrayContaining(['BOTH_PLAYFUL_TALKERS', 'SIMILAR_CLOSENESS']));
  });

  it('emits organized/steady reasons', () => {
    const p = profile({ ...domainAnswers('C', 'high'), ...domainAnswers('N', 'low') });
    expect(compatibility(subject(p), subject(p)).reasons).toEqual(expect.arrayContaining(['BOTH_ORGANIZED', 'BOTH_STEADY']));
  });
});
