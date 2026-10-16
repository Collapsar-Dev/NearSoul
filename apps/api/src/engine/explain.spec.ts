import { compatibility } from './compatibility';
import { buildPairReportData, buildPairTeaser, buildSelfReportData, effectiveShareLevel, tipsAbout } from './explain';
import { domainAnswers, profile } from './test-helpers';

const viewer = profile({ ...domainAnswers('O', 'high'), com_02: 5, life_02: 5 });
const other = profile({
  ...domainAnswers('E', 'low'), rel_04: 'cool_down_then_talk', rel_05: ['time', 'help'], rel_02: 5, rel_03: 5,
  com_01: 'daily_checkin', com_02: 5, life_02: 1,
});
const compat = compatibility({ profile: viewer, intent: 'long_term', interests: [] }, { profile: other, intent: 'long_term', interests: [] });

describe('share levels (RPT-003)', () => {
  it('effective level is the minimum of both', () => {
    expect(effectiveShareLevel('deep', 'minimal')).toBe('minimal');
    expect(effectiveShareLevel('standard', 'deep')).toBe('standard');
    expect(effectiveShareLevel('deep', 'deep')).toBe('deep');
  });

  it('minimal: only tier and reasons', () => {
    const r = buildPairReportData(viewer, other, compat, 'deep', 'minimal');
    expect(r.effectiveShareLevel).toBe('minimal');
    expect(r.frictions).toEqual([]);
    expect(r.tips).toEqual([]);
    expect(r.layers).toEqual({});
    expect(r.bigFive).toBeNull();
  });

  it('standard: adds frictions, tips and layer tiers but no Big Five', () => {
    const r = buildPairReportData(viewer, other, compat, 'standard', 'deep');
    expect(r.frictions.length).toBeGreaterThan(0);
    expect(r.tips).toContain('TIP_GIVE_TIME_AFTER_CONFLICT');
    expect(Object.keys(r.layers)).toHaveLength(5);
    expect(r.bigFive).toBeNull();
  });

  it('deep: adds Big Five bands for both', () => {
    const r = buildPairReportData(viewer, other, compat, 'deep', 'deep');
    expect(r.bigFive?.other.E).toBe('low');
    expect(r.bigFive?.viewer.O).toBe('high');
  });

  it('teaser exposes only tier, 3 reasons and locked section counts', () => {
    const t = buildPairTeaser(buildPairReportData(viewer, other, compat, 'deep', 'deep'));
    expect(Object.keys(t).sort()).toEqual(['lockedSections', 'reasons', 'tier']);
    expect(t.reasons.length).toBeLessThanOrEqual(3);
    expect(t.lockedSections.map((s) => s.key)).toEqual(['frictions', 'tips', 'layers', 'first_date']);
  });
});

describe('tips (ENG-013)', () => {
  it('derives tips from the other person only', () => {
    expect(tipsAbout(other)).toEqual([
      'TIP_GIVE_TIME_AFTER_CONFLICT', 'TIP_DAILY_CHECKIN', 'TIP_DEEP_QUESTIONS',
      'TIP_SHOW_CARE:help', 'TIP_SHOW_CARE:time', 'TIP_RESPECT_SPACE', 'TIP_REASSURE',
    ]);
    expect(tipsAbout(profile({ rel_04: 'talk_now', com_01: 'prefer_meeting', com_02: 1, rel_05: ['words'] })))
      .toEqual(expect.arrayContaining(['TIP_TALK_IT_THROUGH', 'TIP_PREFERS_MEETING', 'TIP_KEEP_IT_LIGHT']));
  });
});

describe('self report data (RPT-001)', () => {
  it('builds strengths, style, needs and gentle growth edges', () => {
    const p = profile({ ...domainAnswers('O', 'high'), ...domainAnswers('N', 'high'), ...domainAnswers('C', 'low'), ...domainAnswers('A', 'low'), rel_02: 5, rel_03: 5, rel_04: 'talk_now' });
    const r = buildSelfReportData(p);
    expect(r.strengths).toHaveLength(3);
    // all four extreme domains tie on distance from 50 → fixed domain order O, C, A, S
    expect(r.strengths).toEqual(['curious', 'flexible', 'independent_minded']);
    const q = profile({ ...domainAnswers('N', 'high'), mi_05: 4 });
    expect(buildSelfReportData(q).strengths[0]).toBe('feels_deeply');
    expect(r.relationshipStyle).toEqual(expect.arrayContaining(['INDEPENDENCE_HIGH', 'CONFLICT_TALK_NOW']));
    expect(r.needs).toContain('NEED_TALK_IT_THROUGH');
    expect(r.growthEdges).toEqual(['GROWTH_CLOSENESS_AND_SPACE', 'GROWTH_SELF_SOOTHING', 'GROWTH_FOLLOW_THROUGH']);
    expect(r.domains.O.band).toBe('high');
  });
});
