import { randomUUID } from 'node:crypto';
import { bearer, createTestApp, onboard, resetDb, signIn, type TestCtx } from './helpers/app';

const sub = (n: number, host = 'fcm.googleapis.com') =>
  JSON.stringify({ endpoint: `https://${host}/fcm/send/abc${n}`, expirationTime: null, keys: { p256dh: 'BPk' + 'x'.repeat(84), auth: 'a'.repeat(22) } });

describe('Push notifications (NOTIF-001, Web Push + FCM)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('serves a stable VAPID public key generated once', async () => {
    const { token } = await signIn(ctx, 'push@example.com');
    const a = await ctx.http.get('/v1/push/config').set(bearer(token)).expect(200);
    const b = await ctx.http.get('/v1/push/config').set(bearer(token)).expect(200);
    expect(a.body.webPushPublicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    expect(b.body.webPushPublicKey).toBe(a.body.webPushPublicKey);
    expect(a.body.fcmEnabled).toBe(false);
    await ctx.http.get('/v1/push/config').expect(401);
  });

  it('accepts only subscriptions to known push services (no SSRF)', async () => {
    const { token } = await signIn(ctx, 'push@example.com');
    for (const bad of [sub(1, 'evil.example.com'), sub(1, '169.254.169.254'), 'not json', JSON.stringify({ endpoint: 'http://fcm.googleapis.com/x', keys: { p256dh: 'p'.repeat(20), auth: 'a' } })]) {
      const res = await ctx.http.post('/v1/devices').set(bearer(token)).send({ token: bad, platform: 'web' });
      expect(res.status).toBe(400);
    }
    await ctx.http.post('/v1/devices').set(bearer(token)).send({ token: sub(1, 'web.push.apple.com'), platform: 'web' }).expect(204);
    await ctx.http.post('/v1/devices').set(bearer(token)).send({ token: sub(3, 'jmt17.google.com'), platform: 'web' }).expect(204);
    // re-subscribing in the same session replaces the old browser subscription
    await ctx.http.post('/v1/devices').set(bearer(token)).send({ token: sub(2), platform: 'web' }).expect(204);
    expect(await ctx.prisma.deviceToken.count()).toBe(1);
  });

  it('a match pushes generic, localized text to both people; message bodies never leave the server', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.patch('/v1/me').set(bearer(b.token)).send({ locale: 'ru' }).expect(200);
    await ctx.http.post('/v1/devices').set(bearer(a.token)).send({ token: sub(1), platform: 'web' }).expect(204);
    await ctx.http.post('/v1/devices').set(bearer(b.token)).send({ token: sub(2), platform: 'web' }).expect(204);
    await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(b.token)).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' }).expect(200);
    const m = await ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' }).expect(200);
    await ctx.pushService.flush();
    const matchPushes = ctx.push.sent.filter((s) => s.msg.data.type === 'new_match');
    expect(matchPushes.map((p) => p.msg.title).sort()).toEqual(['It’s a match! 🎉', 'Это взаимно! 🎉']);
    expect(matchPushes[0]!.msg.data.matchId).toBe(m.body.match.id);

    ctx.push.sent = [];
    await ctx.http.post(`/v1/matches/${m.body.match.id}/messages`).set(bearer(a.token)).send({ clientMessageId: randomUUID(), body: 'secret meeting place' }).expect(201);
    await ctx.pushService.flush();
    expect(ctx.push.sent).toHaveLength(1);
    expect(ctx.push.sent[0]!.msg.body).toBe('У вас новое сообщение');
    expect(JSON.stringify(ctx.push.sent)).not.toContain('secret');
  });

  it('drops expired subscriptions and skips revoked sessions', async () => {
    const a = await signIn(ctx, 'push@example.com');
    await ctx.http.post('/v1/devices').set(bearer(a.token)).send({ token: sub(1), platform: 'web' }).expect(204);
    ctx.push.result = 'gone';
    ctx.pushService.send(a.userId, { title: 't', body: 'b', data: { type: 'new_message' } });
    await ctx.pushService.flush();
    expect(await ctx.prisma.deviceToken.count()).toBe(0);

    ctx.push.result = 'ok';
    ctx.push.sent = [];
    await ctx.http.post('/v1/devices').set(bearer(a.token)).send({ token: sub(2), platform: 'web' }).expect(204);
    await ctx.prisma.session.updateMany({ data: { revokedAt: new Date() } });
    ctx.pushService.send(a.userId, { title: 't', body: 'b', data: { type: 'new_message' } });
    await ctx.pushService.flush();
    expect(ctx.push.sent).toHaveLength(0);
  });

  it('subscriptions survive refresh-token rotation and are dropped on logout', async () => {
    const a = await signIn(ctx, 'push@example.com');
    await ctx.http.post('/v1/devices').set(bearer(a.token)).send({ token: sub(1), platform: 'web' }).expect(204);
    const r = await ctx.http.post('/v1/auth/refresh').send({ refreshToken: a.refreshToken }).expect(200);
    ctx.pushService.send(a.userId, { title: 't', body: 'b', data: { type: 'new_message' } });
    await ctx.pushService.flush();
    expect(ctx.push.sent).toHaveLength(1);
    await ctx.http.post('/v1/auth/logout').set(bearer(r.body.accessToken)).expect(204);
    expect(await ctx.prisma.deviceToken.count()).toBe(0);
  });

  it('native tokens are kept but not sent until FCM is configured', async () => {
    const a = await signIn(ctx, 'push@example.com');
    await ctx.http.post('/v1/devices').set(bearer(a.token)).send({ token: 'fcm-token-1234567890', platform: 'android' }).expect(204);
    ctx.pushService.send(a.userId, { title: 't', body: 'b', data: { type: 'new_message' } });
    await ctx.pushService.flush();
    expect(ctx.push.sent).toHaveLength(0);
    expect(await ctx.prisma.deviceToken.count()).toBe(1);
  });
});
