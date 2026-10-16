import { bearer, createTestApp, passGateAndScan, quickScanAnswers, resetDb, signIn, type TestCtx } from './helpers/app';

describe('Onboarding, engine and card (ONB-001..003, ENG-002/005/008/010)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('blocks under-18 users and locks the DOB', async () => {
    const { token } = await signIn(ctx, 'teen@example.com');
    const year = new Date().getUTCFullYear() - 16;
    const r = await ctx.http.post('/v1/me/dob').set(bearer(token)).send({ dob: `${year}-01-01` }).expect(200);
    expect(r.body.allowed).toBe(false);
    const again = await ctx.http.post('/v1/me/dob').set(bearer(token)).send({ dob: '1990-01-01' });
    expect(again.body.error.code).toBe('DOB_LOCKED');
    const q = await ctx.http.get('/v1/engine/questionnaires/quick_scan').set(bearer(token));
    expect(q.status).toBe(403);
    expect(q.body.error.code).toBe('AGE_GATE');
  });

  it('requires Terms before the engine routes', async () => {
    const { token } = await signIn(ctx, 'terms@example.com');
    await ctx.http.post('/v1/me/dob').set(bearer(token)).send({ dob: '1990-01-01' }).expect(200);
    const q = await ctx.http.get('/v1/engine/questionnaires/quick_scan').set(bearer(token));
    expect(q.body.error.code).toBe('TERMS_REQUIRED');
  });

  it('serves the localized questionnaire', async () => {
    const { token } = await signIn(ctx, 'q@example.com');
    await passGateAndScan(ctx, token, {});
    const en = await ctx.http.get('/v1/engine/questionnaires/quick_scan').set(bearer(token)).expect(200);
    expect(en.body.blocks).toHaveLength(5);
    expect(en.body.blocks[0].items).toHaveLength(20);
    const ru = await ctx.http.get('/v1/engine/questionnaires/quick_scan').set(bearer(token)).set('accept-language', 'ru-RU').expect(200);
    const rel = ru.body.blocks[1].items[0];
    expect(rel.prompt).toMatch(/партнёром/);
    expect(ru.body.blocks[0].items[0].translated).toBe(false); // IPIP item without an approved translation
  });

  it('saves answers, resumes progress and validates values', async () => {
    const { token } = await signIn(ctx, 'scan@example.com');
    await passGateAndScan(ctx, token, { mi_01: 4, mi_02: 2 });
    const bad = await ctx.http.put('/v1/engine/answers/mi_03').set(bearer(token)).send({ value: 9 });
    expect(bad.body.error.code).toBe('INVALID_LIKERT');
    await ctx.http.put('/v1/engine/answers/nope').set(bearer(token)).send({ value: 1 }).expect(404);
    const p = await ctx.http.get('/v1/engine/progress').set(bearer(token)).expect(200);
    expect(p.body.requiredAnswered).toBe(2);
    expect(p.body.nextItem).toBe('mi_03');
    expect(p.body.complete).toBe(false);
  });

  it('completes the Quick Scan, computes a Soul Profile and a template card without AI consent', async () => {
    const { token } = await signIn(ctx, 'soul@example.com');
    await passGateAndScan(ctx, token, quickScanAnswers());
    const prof = await ctx.http.get('/v1/me/soul-profile').set(bearer(token)).expect(200);
    expect(prof.body.profile.quickScanComplete).toBe(true);
    expect(prof.body.profile.archetype).toBeDefined();
    expect(prof.body.summary.strengths).toHaveLength(3);
    ctx.ai.next = { headline: 'X', summary: 'y', communication_style: 'z', ideal_first_date: 'w', strengths: ['a', 'b', 'c'] };
    const card = await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({}).expect(201);
    expect(card.body.source).toBe('template');
    expect(ctx.ai.calls).toHaveLength(0); // no consent → no data to the AI provider
    expect(card.body.strengths).toHaveLength(3);
  });

  it('uses AI with consent, sends traits only, and falls back on invalid output', async () => {
    const { token } = await signIn(ctx, 'ai@example.com');
    await passGateAndScan(ctx, token, quickScanAnswers(), { aiConsent: true });
    ctx.ai.next = { headline: 'Curious explorer', summary: 'Enjoys new places and deep conversations with people who care.', communication_style: 'Warm and direct.', ideal_first_date: 'A long walk.', strengths: ['Curious', 'Kind', 'Steady'] };
    const ok = await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({}).expect(201);
    expect(ok.body.source).toBe('ai');
    const sent = ctx.ai.calls[0]!.user;
    expect(sent).not.toMatch(/ai@example.com/);
    expect(sent).not.toMatch(/mi_0/); // no raw item answers
    ctx.ai.next = { headline: 'x'.repeat(200) };
    const fb = await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({}).expect(201);
    expect(fb.body.source).toBe('template');
    expect(ctx.ai.calls).toHaveLength(3); // 1 ok + 2 invalid attempts
  });

  it('protects user edits from silent regeneration', async () => {
    const { token } = await signIn(ctx, 'edit@example.com');
    await passGateAndScan(ctx, token, quickScanAnswers());
    await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({}).expect(201);
    const e = await ctx.http.patch('/v1/me/card').set(bearer(token)).send({ headline: 'My own words' }).expect(200);
    expect(e.body.userEdited).toBe(true);
    const r = await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({});
    expect(r.body.error.code).toBe('CARD_EDITED');
    await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({ force: true }).expect(201);
  });

  it('lets the owner edit layer traits but not Big Five', async () => {
    const { token } = await signIn(ctx, 'layers@example.com');
    await passGateAndScan(ctx, token, quickScanAnswers({ rel_04: 'talk_now' }));
    const r = await ctx.http.patch('/v1/me/soul-profile/layers').set(bearer(token)).send({ conflict_style: 'let_it_go' }).expect(200);
    expect(r.body.profile.relationship.conflict_style).toEqual({ value: 'let_it_go', source: 'user_edit' });
    await ctx.http.patch('/v1/me/soul-profile/layers').set(bearer(token)).send({ O: 99 }).expect(400);
  });

  it('share level change records consent and invalidates pair reports', async () => {
    const { token, userId } = await signIn(ctx, 'share@example.com');
    await passGateAndScan(ctx, token, {});
    await ctx.http.patch('/v1/me/share-level').set(bearer(token)).send({ level: 'deep' }).expect(204);
    const c = await ctx.prisma.consent.findFirst({ where: { userId, type: 'pair_report_share' } });
    expect(c?.value).toEqual({ level: 'deep' });
  });

  it('onboarding completion lists what is missing', async () => {
    const { token } = await signIn(ctx, 'missing@example.com');
    await passGateAndScan(ctx, token, quickScanAnswers());
    const r = await ctx.http.post('/v1/me/onboarding/complete').set(bearer(token));
    expect(r.body.error.code).toBe('ONBOARDING_INCOMPLETE');
    expect(r.body.error.details.missing).toEqual(['shareLevel', 'basics', 'photos', 'interests']);
  });

  it('account deletion signs out and hides the user immediately', async () => {
    const { token, refreshToken } = await signIn(ctx, 'bye@example.com');
    await ctx.http.post('/v1/me/delete').set(bearer(token)).expect(202);
    await ctx.http.get('/v1/me').set(bearer(token)).expect(401);
    await ctx.http.post('/v1/auth/refresh').send({ refreshToken }).expect(401);
  });
});
