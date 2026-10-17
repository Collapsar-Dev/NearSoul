import fc from 'fast-check';
import { QUICK_SCAN_ITEMS, REQUIRED_QUICK_SCAN_KEYS, validateAnswer, ITEMS_BY_KEY } from './items';
import { bandFor, consistencyFlags, depthOf, isStraightLining, percentileOf, scoreProfile, toScore } from './scoring';
import { AT, answers, arbAnswers, domainAnswers, profile } from './test-helpers';
import type { NormTable } from './types';

describe('item bank (ENG-001/002)', () => {
  it('has 37 Quick Scan items with unique keys; 10 starter items are required (CR-21)', () => {
    expect(QUICK_SCAN_ITEMS).toHaveLength(37);
    expect(new Set(QUICK_SCAN_ITEMS.map((i) => i.key)).size).toBe(37);
    expect(REQUIRED_QUICK_SCAN_KEYS).toHaveLength(10);
    // one Mini-IPIP item per domain in the starter set
    expect(new Set(REQUIRED_QUICK_SCAN_KEYS.filter((k) => k.startsWith('mi_')).map((k) => QUICK_SCAN_ITEMS.find((i) => i.key === k)!.domain)).size).toBe(5);
  });

  it('has 4 Mini-IPIP items per domain with 2 positive and 2 reverse keys', () => {
    for (const d of ['O', 'C', 'E', 'A', 'N'] as const) {
      const items = QUICK_SCAN_ITEMS.filter((i) => i.domain === d);
      expect(items).toHaveLength(4);
      if (d !== 'O') expect(items.filter((i) => i.keyed === -1)).toHaveLength(2);
    }
  });

  it.each([
    ['mi_01', 3, null], ['mi_01', 0, 'INVALID_LIKERT'], ['mi_01', 2.5, 'INVALID_LIKERT'], ['mi_01', '3', 'INVALID_LIKERT'],
    ['rel_04', 'talk_now', null], ['rel_04', 'shout', 'INVALID_OPTION'],
    ['val_01', ['family', 'career', 'health'], null], ['val_01', ['family'], 'TOO_FEW'],
    ['val_01', ['family', 'career', 'health', 'faith'], 'TOO_MANY'], ['val_01', ['family', 'family', 'career'], 'DUPLICATE_OPTION'],
    ['val_01', ['family', 'career', 'nope'], 'INVALID_OPTION'], ['val_01', 'family', 'INVALID_MULTI'],
    ['rel_05', [1], 'INVALID_MULTI'], ['mi_01', null, null],
  ])('validateAnswer(%s, %j) → %s', (key, value, expected) => {
    expect(validateAnswer(ITEMS_BY_KEY.get(key)!, value)).toBe(expected);
  });
});

describe('scoring (ENG-005)', () => {
  it('maps a Likert mean to 0–100', () => {
    expect(toScore(1)).toBe(0);
    expect(toScore(3)).toBe(50);
    expect(toScore(5)).toBe(100);
  });

  it('applies reverse keys', () => {
    const p = profile(domainAnswers('E', 'high'));
    expect(p.domains.E.score).toBe(100);
    expect(profile(domainAnswers('E', 'low')).domains.E.score).toBe(0);
  });

  it('exposes Emotional Stability as 100 − Neuroticism', () => {
    expect(profile(domainAnswers('N', 'high')).domains.S.score).toBe(0);
    expect(profile(domainAnswers('N', 'low')).domains.S.score).toBe(100);
  });

  it('scores a domain from one answer with low confidence, and returns null with none (CR-21)', () => {
    const one = scoreProfile(answers({ mi_01: undefined as never, mi_06: undefined as never, mi_11: undefined as never }));
    expect(one.domains.E.score).not.toBeNull();
    expect(one.domains.E.confidence).toBe(0.25);
    const none = scoreProfile(answers({ mi_01: undefined as never, mi_06: undefined as never, mi_11: undefined as never, mi_16: undefined as never }));
    expect(none.domains.E.score).toBeNull();
    expect(none.domains.E.confidence).toBe(0);
  });

  it('scores a domain from 2 of 4 answers with confidence 0.5', () => {
    const p = scoreProfile(answers({ mi_01: undefined as never, mi_11: undefined as never }));
    expect(p.domains.E.score).toBe(50);
    expect(p.domains.E.confidence).toBe(0.5);
  });

  it('bands use theoretical thresholds by default', () => {
    expect(bandFor(34, 'O')).toBe('low');
    expect(bandFor(35, 'O')).toBe('balanced');
    expect(bandFor(65, 'O')).toBe('balanced');
    expect(bandFor(66, 'O')).toBe('high');
    expect(bandFor(null, 'O')).toBeNull();
  });

  it('bands use empirical percentiles when a norm table exists', () => {
    const table = Array.from({ length: 101 }, (_, i) => i); // identity norms
    const norms: NormTable = { version: 'n1', percentiles: { O: table } };
    expect(percentileOf(80, table)).toBe(80);
    expect(bandFor(29, 'O', norms)).toBe('low');
    expect(bandFor(50, 'O', norms)).toBe('balanced');
    expect(bandFor(71, 'O', norms)).toBe('high');
    expect(bandFor(71, 'C', norms)).toBe('high'); // falls back to theoretical
    expect(scoreProfile(answers(), { norms }).normsVersion).toBe('n1');
  });

  it('marks the Quick Scan complete only when all required items are answered', () => {
    expect(profile().quickScanComplete).toBe(true);
    expect(scoreProfile(answers({ val_02: undefined as never })).quickScanComplete).toBe(false);
  });

  it('parses dealbreakers and ignores unknown keys', () => {
    expect(profile({ deal_01: ['smoker', 'bogus', 'has_kids'] }).dealbreakers).toEqual(['has_kids', 'smoker']);
    expect(profile().dealbreakers).toEqual([]);
  });

  it('maps layer traits', () => {
    const p = profile({ rel_04: 'cool_down_then_talk', rel_05: ['time', 'words'], val_01: ['growth', 'adventure', 'family'], com_02: 5, life_02: 1 });
    expect(p.relationship.conflict_style.value).toBe('cool_down_then_talk');
    expect(p.relationship.care_language.value).toEqual(['time', 'words']);
    expect(p.values.values.value).toEqual(['adventure', 'family', 'growth']);
    expect(p.communication.conversation_depth.score).toBe(100);
    expect(p.lifestyle.spontaneity.score).toBe(0);
  });

  it('treats invalid stored values as unknown', () => {
    const p = profile({ rel_04: 'nonsense', rel_05: [], com_02: 'x' as never });
    expect(p.relationship.conflict_style.value).toBeNull();
    expect(p.relationship.care_language.value).toBeNull();
    expect(p.communication.conversation_depth.score).toBeNull();
  });

  it('is deterministic: same answers ⇒ identical profile (ENG-008)', () => {
    fc.assert(fc.property(arbAnswers, (a) => {
      expect(JSON.stringify(scoreProfile(a))).toBe(JSON.stringify(scoreProfile(structuredClone(a))));
    }), { numRuns: 200 });
  });

  it('keeps every numeric output within bounds', () => {
    fc.assert(fc.property(arbAnswers, (a) => {
      const p = scoreProfile(a);
      for (const d of Object.values(p.domains)) {
        if (d.score !== null) expect(d.score).toBeGreaterThanOrEqual(0);
        if (d.score !== null) expect(d.score).toBeLessThanOrEqual(100);
        expect(d.confidence).toBeGreaterThanOrEqual(0);
        expect(d.confidence).toBeLessThanOrEqual(1);
      }
      expect(p.depth).toBeGreaterThanOrEqual(0);
      expect(p.depth).toBeLessThanOrEqual(100);
    }), { numRuns: 200 });
  });

  it('matches the golden snapshot for a reference persona', () => {
    const p = profile({ ...domainAnswers('O', 'high'), ...domainAnswers('E', 'high'), rel_04: 'talk_now', val_01: ['adventure', 'growth', 'freedom'] });
    expect(p).toMatchSnapshot();
  });
});

describe('quality checks (ENG-006)', () => {
  it('flags positive and reverse items answered at the same extreme', () => {
    const a = answers({ mi_01: 5, mi_16: 5 });
    expect(consistencyFlags(a)).toEqual(['E']);
    const p = scoreProfile(a);
    expect(p.quality.consistencyFlags).toEqual(['E']);
    expect(p.domains.E.confidence).toBe(0.7);
  });

  it('reports a neuroticism flag as S', () => {
    expect(scoreProfile(answers({ mi_14: 1, mi_09: 1 })).quality.consistencyFlags).toEqual(['S']);
  });

  it('does not flag middle answers', () => {
    expect(consistencyFlags(answers({ mi_01: 3, mi_16: 3 }))).toEqual([]);
  });

  it('detects straight-lining and lowers confidence', () => {
    const flat: Record<string, number> = {};
    for (const i of QUICK_SCAN_ITEMS.filter((x) => x.block === 'A')) flat[i.key] = 3;
    const a = answers(flat);
    expect(isStraightLining(a)).toBe(true);
    expect(scoreProfile(a).domains.O.confidence).toBe(0.7);
    expect(isStraightLining(answers())).toBe(false);
  });

  it('needs at least 10 answers to judge straight-lining', () => {
    const a: Record<string, { value: number; answeredAt: string }> = {};
    for (const k of ['mi_01', 'mi_02', 'mi_03']) a[k] = { value: 3, answeredAt: AT };
    expect(isStraightLining(a)).toBe(false);
  });

  it('computes profile depth', () => {
    expect(depthOf(false, { deepPartsCompleted: 0, keptInsights: 0, extraLevelsCompleted: 0 })).toBe(0);
    expect(depthOf(true, { deepPartsCompleted: 0, keptInsights: 0, extraLevelsCompleted: 0 })).toBe(40);
    expect(depthOf(true, { deepPartsCompleted: 4, keptInsights: 5, extraLevelsCompleted: 2 })).toBe(100);
    expect(depthOf(true, { deepPartsCompleted: 9, keptInsights: 99, extraLevelsCompleted: 9 })).toBe(100);
    expect(depthOf(true, { deepPartsCompleted: 2, keptInsights: 1, extraLevelsCompleted: 0 })).toBe(58);
  });
});

describe('layer overrides (SOUL-005)', () => {
  it('a newer user-confirmed value wins over the questionnaire answer', () => {
    const p = scoreProfile(answers({ rel_04: 'talk_now' }), {
      overrides: { conflict_style: { value: 'cool_down_then_talk', updatedAt: '2026-10-02T00:00:00.000Z', source: 'soul_talk' } },
    });
    expect(p.relationship.conflict_style).toEqual({ value: 'cool_down_then_talk', source: 'soul_talk' });
  });

  it('an older override loses to a newer answer', () => {
    const p = scoreProfile(answers({ rel_04: 'talk_now' }), {
      overrides: { conflict_style: { value: 'let_it_go', updatedAt: '2026-09-01T00:00:00.000Z', source: 'user_edit' } },
    });
    expect(p.relationship.conflict_style.value).toBe('talk_now');
  });

  it('applies overrides for unanswered traits and ignores invalid overrides', () => {
    const a = answers({ com_02: undefined as never });
    const p = scoreProfile(a, {
      overrides: {
        conversation_depth: { value: 80, updatedAt: AT, source: 'soul_talk' },
        values: { value: ['nope'], updatedAt: '2030-01-01T00:00:00.000Z', source: 'user_edit' },
        care_language: { value: ['touch'], updatedAt: '2030-01-01T00:00:00.000Z', source: 'soul_talk' },
      },
    });
    expect(p.communication.conversation_depth.score).toBe(80);
    expect(p.communication.conversation_depth.source).toBe('soul_talk');
    expect(p.values.values.source).toBe('quick_scan');
    expect(p.relationship.care_language.value).toEqual(['touch']);
  });
});
