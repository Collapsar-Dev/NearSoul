import { freshness, newUserBoost, rankDailySet, type RankCandidate } from './ranking';

const NOW = '2026-10-16T12:00:00.000Z';
const c = (id: string, score: number, over: Partial<RankCandidate> = {}): RankCandidate => ({
  id, score, archetype: 'explorer', lastActiveAt: NOW, createdAt: '2026-01-01T00:00:00.000Z', ...over,
});

describe('daily set ranking (ENG-014)', () => {
  it('freshness and new-user boost', () => {
    expect(freshness(NOW, NOW)).toBe(1);
    expect(freshness('2026-10-12T12:00:00.000Z', NOW)).toBe(0.95);
    expect(freshness('2026-09-20T12:00:00.000Z', NOW)).toBe(0.8);
    expect(freshness('2026-01-01T00:00:00.000Z', NOW)).toBe(0.6);
    expect(newUserBoost('2026-10-14T00:00:00.000Z', NOW)).toBe(1.1);
    expect(newUserBoost('2026-09-01T00:00:00.000Z', NOW)).toBe(1);
  });

  it('orders by tier, then rank, limited to size', () => {
    const ids = rankDailySet([c('a', 60), c('b', 90, { archetype: 'anchor' }), c('c', 70, { archetype: 'dreamer' }), c('d', 40)], NOW, 3);
    expect(ids).toEqual(['b', 'c', 'a']);
  });

  it('places demo profiles after real people of the same tier', () => {
    const ids = rankDailySet([c('demo', 80, { isDemo: true }), c('real', 76, { archetype: 'anchor' })], NOW, 2);
    expect(ids).toEqual(['real', 'demo']);
  });

  it('a higher tier demo still beats a lower tier real person', () => {
    expect(rankDailySet([c('real', 60), c('demo', 80, { isDemo: true })], NOW, 2)).toEqual(['demo', 'real']);
  });

  it('avoids more than 3 of the same archetype in a row', () => {
    const list = [c('e1', 99), c('e2', 98), c('e3', 97), c('e4', 96), c('x', 90, { archetype: 'anchor' })];
    expect(rankDailySet(list, NOW, 5)).toEqual(['e1', 'e2', 'e3', 'x', 'e4']);
  });

  it('falls back to the same archetype when nothing else is left', () => {
    const list = [c('e1', 99), c('e2', 98), c('e3', 97), c('e4', 96)];
    expect(rankDailySet(list, NOW, 4)).toEqual(['e1', 'e2', 'e3', 'e4']);
  });

  it('is stable for equal ranks (id order)', () => {
    expect(rankDailySet([c('b', 80), c('a', 80)], NOW, 2)).toEqual(['a', 'b']);
  });
});
