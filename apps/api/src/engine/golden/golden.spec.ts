import { goldenResults } from './results';

describe('golden persona pairs (ENG-012)', () => {
  const results = goldenResults();

  it('matches the founder-reviewed snapshot', () => {
    expect(results).toMatchSnapshot();
  });

  it('sanity: close matches outrank clear mismatches', () => {
    const score = (p: string) => results.find((r) => r.pair === p)!.score;
    expect(score('mia+leo')).toBeGreaterThan(score('zoe+max'));
    expect(score('anna+tom')).toBeGreaterThan(score('ivan+anna'));
    expect(score('anna+tom')).toBeGreaterThanOrEqual(75);
  });

  it('incompatible intents are filtered before scoring (casual vs long-term)', () => {
    expect(results.find((r) => r.pair === 'zoe+anna')!.eligible).toBe('INTENT');
  });
});
