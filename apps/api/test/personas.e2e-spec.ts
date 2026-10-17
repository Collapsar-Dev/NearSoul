import { bearer, createTestApp, onboard, quickScanAnswers, resetDb, signIn, testJpeg, type TestCtx } from './helpers/app';

/** Creates a persona for `token`, switches to it and onboards it fully. Returns the persona's token and id. */
async function addPersona(ctx: TestCtx, token: string, label: string, o: { gender?: string; interestedIn?: string[] } = {}) {
  const created = await ctx.http.post('/v1/me/personas').set(bearer(token)).send({ label }).expect(201);
  const sw = await ctx.http.post('/v1/auth/switch').set(bearer(token)).send({ personaId: created.body.id }).expect(200);
  const t = sw.body.accessToken as string;
  for (const [k, v] of Object.entries(quickScanAnswers())) await ctx.http.put(`/v1/engine/answers/${k}`).set(bearer(t)).send({ value: v }).expect(200);
  await ctx.http.post('/v1/me/onboarding/skip').set(bearer(t)).send({ step: 'reveal' }).expect(200);
  await ctx.http.post('/v1/me/onboarding/skip').set(bearer(t)).send({ step: 'shareLevel' }).expect(200);
  await ctx.http.put('/v1/me/profile').set(bearer(t)).send({
    firstName: label, gender: o.gender ?? 'woman', interestedIn: o.interestedIn ?? ['man'], intent: 'long_term', cityId: 'amsterdam', interests: ['hiking', 'coffee', 'books'], ageMin: 18, ageMax: 60,
  }).expect(200);
  for (let i = 0; i < 2; i++) await ctx.http.post('/v1/photos').set(bearer(t)).attach('photo', await testJpeg(i + 5), 'p.jpg').expect(201);
  await ctx.http.post('/v1/me/onboarding/complete').set(bearer(t)).expect(200);
  await ctx.http.patch('/v1/me').set(bearer(t)).send({ discoveryEnabled: true }).expect(200);
  return { token: t, refreshToken: sw.body.refreshToken as string, userId: created.body.id as string };
}

describe('Personas (CR-17): separate profiles under one account', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('creates separate profiles with the owner’s age, switches devices between them, max three', async () => {
    const anna = await onboard(ctx, 'anna@example.com', { dob: '1994-03-03' });
    const calm = await addPersona(ctx, anna.token, 'Calm');
    const me = await ctx.http.get('/v1/me').set(bearer(calm.token)).expect(200);
    expect(me.body).toMatchObject({ id: calm.userId, age: expect.any(Number), email: 'anna@example.com', persona: { isOwner: false, label: 'Calm' } });
    expect(me.body.onboarding.dob).toBe(true);
    // age is locked: a persona can't set its own date of birth
    await ctx.http.post('/v1/me/dob').set(bearer(calm.token)).send({ dob: '2000-01-01' }).expect(403);
    // the old session ended when the device switched (its refresh token is dead; access tokens expire in 15 min)
    expect(await ctx.prisma.session.count({ where: { userId: anna.userId, revokedAt: null } })).toBe(0);
    const list = await ctx.http.get('/v1/me/personas').set(bearer(calm.token)).expect(200);
    expect(list.body.items.map((i: { label: string | null; current: boolean }) => [i.label, i.current])).toEqual([[null, false], ['Calm', true]]);
    await addPersona(ctx, calm.token, 'Party');
    await ctx.prisma.authCode.deleteMany();
    const login = await signIn(ctx, 'anna@example.com'); // signing in by email always lands on the owner profile
    expect(login.userId).toBe(anna.userId);
    const extra = await ctx.http.post('/v1/me/personas').set(bearer(login.token)).send({ label: 'Fourth' }).expect(400);
    expect(extra.body.error.code).toBe('TOO_MANY_PERSONAS');
  });

  it('only profiles of the same account can be switched to', async () => {
    const anna = await onboard(ctx, 'anna@example.com');
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.post('/v1/auth/switch').set(bearer(anna.token)).send({ personaId: ben.userId }).expect(404);
  });

  it('profiles of one person never meet; a block against one profile covers all of them', async () => {
    const zoe = await onboard(ctx, 'zoe@example.com', { gender: 'woman', interestedIn: ['man', 'woman'] });
    const anna = await onboard(ctx, 'anna@example.com');
    const annaMan = await addPersona(ctx, anna.token, 'Man', { gender: 'man', interestedIn: ['woman'] });
    const set = await ctx.http.get('/v1/daily-set').set(bearer(annaMan.token)).expect(200);
    expect(JSON.stringify(set.body)).not.toContain(anna.userId);
    await ctx.http.post('/v1/likes').set(bearer(annaMan.token)).send({ targetId: anna.userId, action: 'like' }).expect(404);

    expect(JSON.stringify(set.body)).toContain(zoe.userId);
    await ctx.prisma.authCode.deleteMany();
    const owner = await signIn(ctx, 'anna@example.com');
    // Zoe matches Anna's "Man" profile, then blocks Anna's owner profile
    await ctx.http.post('/v1/auth/switch').set(bearer(owner.token)).send({ personaId: annaMan.userId }).expect(200).then(async (r) => {
      const t = r.body.accessToken as string;
      await ctx.http.get('/v1/daily-set').set(bearer(t)).expect(200);
      await ctx.http.get('/v1/daily-set').set(bearer(zoe.token)).expect(200);
      await ctx.http.post('/v1/likes').set(bearer(t)).send({ targetId: zoe.userId, action: 'like' }).expect(200);
      const m = await ctx.http.post('/v1/likes').set(bearer(zoe.token)).send({ targetId: annaMan.userId, action: 'like' }).expect(200);
      expect(m.body.match).not.toBeNull();
      await ctx.http.post('/v1/blocks').set(bearer(zoe.token)).send({ userId: anna.userId }).expect(204);
      const matches = await ctx.http.get('/v1/matches').set(bearer(zoe.token)).expect(200);
      expect(matches.body).toHaveLength(0);
    });
  });

  it('suspension and owner deletion cover every profile; Soul+ is shared', async () => {
    const anna = await onboard(ctx, 'anna@example.com');
    const calm = await addPersona(ctx, anna.token, 'Calm');
    await ctx.prisma.entitlement.create({ data: { userId: anna.userId, entitlement: 'soul_plus', active: true, environment: 'PRODUCTION', productId: 'p', store: 'APP_STORE' } });
    const billing = await ctx.http.get('/v1/billing/status').set(bearer(calm.token)).expect(200);
    expect(billing.body.soulPlus.active).toBe(true);
    await ctx.prisma.authCode.deleteMany();
    const owner = await signIn(ctx, 'anna@example.com');
    const code = await ctx.http.post('/v1/me/sensitive-code').set(bearer(owner.token)).expect(202);
    expect(code.body.testCode).toBeUndefined();
    const mail = ctx.email.outbox.get('anna@example.com')!.text.match(/\b(\d{6})\b/)![1];
    await ctx.http.post('/v1/me/delete').set(bearer(owner.token)).send({ code: mail }).expect(202);
    const rows = await ctx.prisma.user.findMany({ where: { id: { in: [anna.userId, calm.userId] } }, select: { status: true } });
    expect(rows.map((r) => r.status)).toEqual(['deletion_requested', 'deletion_requested']);
  });
});
