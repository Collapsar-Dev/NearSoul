import { bearer, createTestApp, onboard, passGateAndScan, resetDb, signIn, type TestCtx } from './helpers/app';

describe('Compatibility check by link (CR-31)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('a friend who only did the questions can check; both see the same percent; no answers leak', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const link = await ctx.http.get('/v1/me/soul-link').set(bearer(a.token)).expect(200);
    expect(link.body.url).toContain(`/c/${link.body.code}`);
    expect((await ctx.http.get('/v1/me/soul-link').set(bearer(a.token))).body.code).toBe(link.body.code); // stable

    // friend: same gender, no photos, onboarding not finished — still allowed after the questions
    const f = await signIn(ctx, 'friend@example.com');
    await passGateAndScan(ctx, f.token);
    const pre = await ctx.http.get(`/v1/soul-links/${link.body.code}`).set(bearer(f.token)).expect(200);
    expect(pre.body).toMatchObject({ firstName: 'anna', isMe: false, existing: null });
    const r = await ctx.http.post(`/v1/soul-links/${link.body.code}/check`).set(bearer(f.token)).expect(200);
    expect(r.body.percent % 5).toBe(0);
    expect(r.body.reasons.length).toBeLessThanOrEqual(3);
    expect(JSON.stringify(r.body)).not.toMatch(/"(score|domains|answers|layerScores)"/);

    const mine = await ctx.http.get('/v1/me/soul-checks').set(bearer(a.token)).expect(200);
    expect(mine.body.items).toEqual([expect.objectContaining({ percent: r.body.percent, theyChecked: true })]);
    expect(await ctx.prisma.notification.count({ where: { userId: a.userId, type: 'soul_check' } })).toBe(1);
    // checking again doesn't notify twice
    await ctx.http.post(`/v1/soul-links/${link.body.code}/check`).set(bearer(f.token)).expect(200);
    expect(await ctx.prisma.notification.count({ where: { userId: a.userId, type: 'soul_check' } })).toBe(1);
    // no match, no chat
    expect(await ctx.prisma.match.count()).toBe(0);
  });

  it('own link, unknown codes, blocks and missing answers are refused', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const { code } = (await ctx.http.get('/v1/me/soul-link').set(bearer(a.token))).body;
    expect((await ctx.http.post(`/v1/soul-links/${code}/check`).set(bearer(a.token))).body.error.code).toBe('OWN_LINK');
    await ctx.http.get('/v1/soul-links/nosuchcode').set(bearer(b.token)).expect(404);
    await ctx.http.get('/v1/soul-links/../x').set(bearer(b.token)).expect(404);

    const n = await signIn(ctx, 'new@example.com');
    await ctx.http.post('/v1/me/dob').set(bearer(n.token)).send({ dob: '1995-05-05' }).expect(200);
    await ctx.http.post('/v1/me/consents').set(bearer(n.token)).send({ terms: true }).expect(200);
    expect((await ctx.http.post(`/v1/soul-links/${code}/check`).set(bearer(n.token))).body.error.code).toBe('NEEDS_ANSWERS');

    await ctx.http.post('/v1/blocks').set(bearer(a.token)).send({ userId: b.userId }).expect(204);
    await ctx.http.post(`/v1/soul-links/${code}/check`).set(bearer(b.token)).expect(404);
  });
});
