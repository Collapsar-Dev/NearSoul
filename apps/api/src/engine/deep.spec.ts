import { DEEP_ITEMS, DEEP_PART_KEYS, FACETS } from './deep-items';
import { DEEP_ITEM_DEFS, ALL_ITEMS_BY_KEY, validateAnswer } from './items';
import { deepPartsCompleted, scoreFacets, scoreProfile } from './scoring';
import { AT, answers } from './test-helpers';
import type { Answers } from './types';

/** All Deep items answered so that `domain` (or every domain) scores high. */
function deepAnswers(level: (facet: string) => 'high' | 'low' | 'mid'): Answers {
  const out: Answers = {};
  for (const i of DEEP_ITEMS) {
    const l = level(i.facet);
    const raw = l === 'mid' ? 3 : (l === 'high') === (i.keyed === 1) ? 5 : 1;
    out[i.key] = { value: raw, answeredAt: AT };
  }
  return out;
}

describe('Deep Personality (ENG-003)', () => {
  it('has 116 items: 29 facets × 4, political O6 excluded, balanced parts', () => {
    expect(DEEP_ITEMS).toHaveLength(116);
    expect(FACETS).toHaveLength(29);
    expect(FACETS).not.toContain('O6');
    for (const f of FACETS) expect(DEEP_ITEMS.filter((i) => i.facet === f)).toHaveLength(4);
    for (const p of [1, 2, 3, 4] as const) expect(DEEP_PART_KEYS[p]).toHaveLength(29);
    expect(new Set(DEEP_ITEMS.map((i) => i.key)).size).toBe(116);
    expect(DEEP_ITEMS.some((i) => /vote|political|crime/i.test(i.text))).toBe(false);
  });

  it('deep items are answerable like Likert items', () => {
    const item = ALL_ITEMS_BY_KEY.get(DEEP_ITEM_DEFS[0]!.key)!;
    expect(validateAnswer(item, 4)).toBeNull();
    expect(validateAnswer(item, 7)).toBe('INVALID_LIKERT');
  });

  it('counts completed parts (skips count as answered)', () => {
    const a: Answers = {};
    for (const k of DEEP_PART_KEYS[1]) a[k] = { value: null, answeredAt: AT };
    expect(deepPartsCompleted(a)).toBe(1);
    delete a[DEEP_PART_KEYS[1][0]!];
    expect(deepPartsCompleted(a)).toBe(0);
  });

  it('scores facets with reverse keys and inverts neuroticism facets into S1–S6', () => {
    const f = scoreFacets(deepAnswers((facet) => (facet === 'E2' || facet === 'N1' ? 'high' : 'mid')));
    expect(f.E2!.score).toBe(100);
    expect(f.S1!.score).toBe(0); // high anxiety → low calm
    expect(f.N1).toBeUndefined();
    expect(f.O1!.score).toBe(50);
    expect(Object.keys(f)).toHaveLength(29);
  });

  it('needs at least 2 of 4 items per facet', () => {
    const items = DEEP_ITEMS.filter((i) => i.facet === 'A1');
    const one: Answers = { [items[0]!.key]: { value: 5, answeredAt: AT } };
    expect(scoreFacets(one).A1!.score).toBeNull();
    const two: Answers = { ...one, [items[1]!.key]: { value: 5, answeredAt: AT } };
    expect(scoreFacets(two).A1!.score).not.toBeNull();
  });

  it('domains switch to the 116-item scores once all parts are done and depth grows by 7.5 per part', () => {
    const quick = answers(); // Mini-IPIP at 50 everywhere
    const base = scoreProfile(quick);
    expect(base.depth).toBe(40);
    expect(base.domains.E.source).toBe('quick_scan');
    const deep = deepAnswers((facet) => (facet[0] === 'E' ? 'high' : 'mid'));
    const partial: Answers = { ...quick };
    for (const k of DEEP_PART_KEYS[1]) partial[k] = deep[k]!;
    const p1 = scoreProfile(partial);
    expect(p1.deepPartsCompleted).toBe(1);
    expect(p1.depth).toBe(48);
    expect(p1.domains.E.source).toBe('quick_scan');
    const full = scoreProfile({ ...quick, ...deep });
    expect(full.deepPartsCompleted).toBe(4);
    expect(full.depth).toBe(70);
    expect(full.domains.E.source).toBe('deep');
    expect(full.domains.E.score).toBe(100);
    expect(full.domains.E.band).toBe('high');
  });
});
