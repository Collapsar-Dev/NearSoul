import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

const activate = (ctx: TestCtx, token: string, tier: string) => ctx.http.post('/v1/billing/test-activate').set(bearer(token)).send({ tier }).expect(200);

describe('VIP "message first" (CR-26)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('only VIP can write first; the recipient sees the request and the profile, accepting opens the chat', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const anna = await onboard(ctx, 'anna@example.com');
    await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    const free = await ctx.http.post('/v1/requests').set(bearer(ben.token)).send({ targetId: anna.userId, body: 'Hi Anna!' }).expect(402);
    expect(free.body.error.code).toBe('UPGRADE_REQUIRED');

    await activate(ctx, ben.token, 'vip');
    await ctx.http.post('/v1/requests').set(bearer(ben.token)).send({ targetId: anna.userId, body: 'my number +31 612345678' }).expect(400);
    const sent = await ctx.http.post('/v1/requests').set(bearer(ben.token)).send({ targetId: anna.userId, body: 'Hi Anna! Loved your hiking photos.' }).expect(200);
    expect(sent.body.status).toBe('pending');
    await ctx.http.post('/v1/requests').set(bearer(ben.token)).send({ targetId: anna.userId, body: 'again' }).expect(409);
    expect(await ctx.prisma.notification.count({ where: { userId: anna.userId, type: 'message_request' } })).toBe(1);

    const inbox = await ctx.http.get('/v1/requests').set(bearer(anna.token)).expect(200);
    expect(inbox.body).toHaveLength(1);
    expect(inbox.body[0]).toMatchObject({ fromId: ben.userId, firstName: 'ben', body: 'Hi Anna! Loved your hiking photos.' });
    await ctx.http.get(`/v1/profiles/${ben.userId}`).set(bearer(anna.token)).expect(200);

    const match = await ctx.http.post(`/v1/requests/${inbox.body[0].id}/accept`).set(bearer(anna.token)).expect(200);
    const msgs = await ctx.http.get(`/v1/matches/${match.body.id}/messages`).set(bearer(anna.token)).expect(200);
    expect(msgs.body.items.map((m: { body: string }) => m.body)).toEqual(['Hi Anna! Loved your hiking photos.']);
    expect((await ctx.http.get('/v1/requests').set(bearer(anna.token))).body).toHaveLength(0);
  });

  it('declining hides the request; the recipient’s preferences still apply', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const anna = await onboard(ctx, 'anna@example.com');
    const zoe = await onboard(ctx, 'zoe@example.com', { interestedIn: ['woman'] }); // not interested in men
    await activate(ctx, ben.token, 'vip');
    await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    await ctx.http.post('/v1/requests').set(bearer(ben.token)).send({ targetId: zoe.userId, body: 'Hi' }).expect(404);
    await ctx.http.post('/v1/requests').set(bearer(ben.token)).send({ targetId: anna.userId, body: 'Hi' }).expect(200);
    const inbox = await ctx.http.get('/v1/requests').set(bearer(anna.token)).expect(200);
    await ctx.http.post(`/v1/requests/${inbox.body[0].id}/decline`).set(bearer(anna.token)).expect(204);
    expect((await ctx.http.get('/v1/requests').set(bearer(anna.token))).body).toHaveLength(0);
    expect(await ctx.prisma.match.count()).toBe(0);
  });
});
