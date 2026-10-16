import { deriveArchetype } from './archetype';
import type { DimensionResult, Domain } from './types';

const dim = (score: number | null): DimensionResult => ({
  score,
  band: score === null ? null : score > 65 ? 'high' : score < 35 ? 'low' : 'balanced',
  confidence: 1,
  source: 'quick_scan',
});
const domains = (s: Partial<Record<Domain, number | null>>) =>
  ({ O: dim(s.O ?? 50), C: dim(s.C ?? 50), E: dim(s.E ?? 50), A: dim(s.A ?? 50), S: dim(s.S ?? 50) }) as Record<Domain, DimensionResult>;

describe('deriveArchetype (ENG-007)', () => {
  it.each([
    [{ O: 90, C: 80 }, 'architect'], [{ O: 90, E: 80 }, 'explorer'], [{ O: 90, A: 80 }, 'dreamer'],
    [{ O: 90, S: 80 }, 'free_spirit'], [{ C: 90, E: 80 }, 'captain'], [{ C: 90, A: 80 }, 'guardian'],
    [{ C: 90, S: 80 }, 'anchor'], [{ E: 90, A: 80 }, 'sunshine'], [{ E: 90, S: 80 }, 'adventurer'],
    [{ A: 90, S: 80 }, 'peacemaker'],
  ])('%j → %s', (scores, expected) => {
    expect(deriveArchetype(domains(scores))).toBe(expected);
  });

  it('pair order does not depend on which score is higher', () => {
    expect(deriveArchetype(domains({ O: 70, C: 95 }))).toBe('architect');
  });

  it('uses the two highest of three high domains', () => {
    expect(deriveArchetype(domains({ O: 70, E: 95, A: 90 }))).toBe('sunshine');
  });

  it('breaks ties by fixed order O, C, E, A, S', () => {
    expect(deriveArchetype(domains({ O: 80, C: 80, E: 80 }))).toBe('architect');
    expect(deriveArchetype(domains({ E: 80, A: 80, S: 80 }))).toBe('sunshine');
  });

  it('single high domain → single variant', () => {
    expect(deriveArchetype(domains({ A: 90 }))).toBe('single_A');
  });

  it('no high domain → harmonizer, unknown domains ignored', () => {
    expect(deriveArchetype(domains({}))).toBe('harmonizer');
    expect(deriveArchetype(domains({ O: null, C: 20 }))).toBe('harmonizer');
  });
});
