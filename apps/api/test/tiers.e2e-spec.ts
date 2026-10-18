import { resetEnvCache } from '../src/config/env';
import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

const activate = (ctx: TestCtx, token: string, tier: string) => ctx.http.post('/v1/billing/test-activate').set(bearer(token)).send({ tier }).expect(200);

describe('Subscription levels (CR-18): Soul+, Gold, VIP with test activation', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ DAILY_SET_SIZE: '2' });
  });
  afterAll(async () => {
    await ctx.app.close();
    process.env.DAILY_SET_SIZE = '15';
    resetEnvCache();
  });
  beforeEach(async () => resetDb(ctx));

  it('test activation switches levels; status lists every level with its features', async () => {
    const anna = await onboard(ctx, 'anna@example.com');
    const free = await ctx.http.get('/v1/billing/status').set(bearer(anna.token)).expect(200);
    expect(free.body).toMatchObject({ tier: 'free', testPurchases: true, features: { dailySetSize: 2, seeLikes: false } });
    expect(free.body.tiers.map((t: { tier: string }) => t.tier)).toEqual(['free', 'plus', 'gold', 'vip']);
    const vip = await activate(ctx, anna.token, 'vip');
    expect(vip.body).toMatchObject({ tier: 'vip', features: { dailySetSize: null, fullReports: true, seeLikes: true, rewind: true, seePersonaCount: true } });
    const gold = await activate(ctx, anna.token, 'gold');
    expect(gold.body.tier).toBe('gold');
    expect((await activate(ctx, anna.token, 'free')).body.tier).toBe('free');
  });

  it('a higher level tops up today’s set; free stays at the daily size', async () => {
    const viewer = await onboard(ctx, 'viewer@example.com', { gender: 'man', interestedIn: ['woman'] });
    for (let i = 0; i < 5; i++) await onboard(ctx, `w${i}@example.com`);
    const free = await ctx.http.get('/v1/daily-set').set(bearer(viewer.token)).expect(200);
    expect(free.body.cards).toHaveLength(2);
    await activate(ctx, viewer.token, 'plus');
    const plus = await ctx.http.get('/v1/daily-set').set(bearer(viewer.token)).expect(200);
    expect(plus.body.cards).toHaveLength(5);
    // the people already shown today stay first
    expect(plus.body.cards.slice(0, 2).map((c: { id: string }) => c.id)).toEqual(free.body.cards.map((c: { id: string }) => c.id));
  });

  it('Liked you: a count for free, the list and like-back from Gold; rewind is Gold', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const anna = await onboard(ctx, 'anna@example.com');
    await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: anna.userId, action: 'like' }).expect(200);
    const free = await ctx.http.get('/v1/likes/received').set(bearer(anna.token)).expect(200);
    expect(free.body).toEqual({ count: 1, canSee: false, ids: [] });
    await ctx.http.get(`/v1/profiles/${ben.userId}`).set(bearer(anna.token)).expect(404);
    const rw = await ctx.http.post('/v1/likes/rewind').set(bearer(anna.token)).expect(402);
    expect(rw.body.error.code).toBe('UPGRADE_REQUIRED');

    await activate(ctx, anna.token, 'gold');
    const gold = await ctx.http.get('/v1/likes/received').set(bearer(anna.token)).expect(200);
    expect(gold.body).toEqual({ count: 1, canSee: true, ids: [ben.userId] });
    await ctx.http.get(`/v1/profiles/${ben.userId}`).set(bearer(anna.token)).expect(200);
    const m = await ctx.http.post('/v1/likes').set(bearer(anna.token)).send({ targetId: ben.userId, action: 'like', source: 'profile' }).expect(200);
    expect(m.body.match).not.toBeNull();
    expect((await ctx.http.get('/v1/likes/received').set(bearer(anna.token))).body.count).toBe(0);
  });

  it('rewind brings back the last pass', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const anna = await onboard(ctx, 'anna@example.com');
    await activate(ctx, ben.token, 'gold');
    await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: anna.userId, action: 'pass' }).expect(200);
    const r = await ctx.http.post('/v1/likes/rewind').set(bearer(ben.token)).expect(200);
    expect(r.body.targetId).toBe(anna.userId);
    const set = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(set.body.cards.find((c: { id: string }) => c.id === anna.userId).action).toBeNull();
    await ctx.http.post('/v1/likes/rewind').set(bearer(ben.token)).expect(404);
  });

  it('only VIP sees how many profiles someone has (the number, not which ones)', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const anna = await onboard(ctx, 'anna@example.com');
    await ctx.http.post('/v1/me/personas').set(bearer(anna.token)).send({ label: 'Calm' }).expect(201);
    const before = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(before.body.cards[0].personaCount).toBeUndefined();
    await activate(ctx, ben.token, 'vip');
    const after = await ctx.http.get(`/v1/profiles/${anna.userId}`).set(bearer(ben.token)).expect(200);
    // the second profile isn't finished, so only active profiles count
    expect(after.body.personaCount).toBe(1);
  });

  it('likes per day equal the daily set size of the level (free = 2 here, VIP unlimited)', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    for (let i = 0; i < 4; i++) await onboard(ctx, `w${i}@example.com`);
    await activate(ctx, ben.token, 'vip');
    const set = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    const ids = set.body.cards.map((c: { id: string }) => c.id);
    await activate(ctx, ben.token, 'free');
    for (const id of ids.slice(0, 2)) await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: id, action: 'like' }).expect(200);
    const third = await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: ids[2], action: 'like' }).expect(429);
    expect(third.body.error).toMatchObject({ code: 'LIKE_LIMIT', details: { limit: 2 } });
    await activate(ctx, ben.token, 'vip');
    await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: ids[2], action: 'like' }).expect(200);
  });

  it('test activation is refused outside the test version', async () => {
    const anna = await onboard(ctx, 'anna@example.com');
    process.env.APP_ENV = 'staging';
    process.env.EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 'x';
    process.env.STORAGE_DRIVER = 's3';
    resetEnvCache();
    try {
      await ctx.http.post('/v1/billing/test-activate').set(bearer(anna.token)).send({ tier: 'vip' }).expect(403);
    } finally {
      process.env.APP_ENV = 'test';
      process.env.EMAIL_PROVIDER = 'console';
      process.env.STORAGE_DRIVER = 'local';
      resetEnvCache();
    }
  });
});
