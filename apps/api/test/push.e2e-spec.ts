import { randomUUID } from 'node:crypto';
import { DailySetService } from '../src/modules/discovery/daily-set.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
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
    // Fixed local afternoon so the test doesn't depend on the wall clock (quiet hours).
    await ctx.http.patch('/v1/me').set(bearer(a.token)).send({ timezone: zoneAt(14) }).expect(200);
    await ctx.http.patch('/v1/me').set(bearer(b.token)).send({ locale: 'ru', timezone: zoneAt(14) }).expect(200);
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

/** An Etc/GMT zone where it is currently `hour` o'clock (Etc/GMT+N means UTC−N). */
function zoneAt(hour: number, now = new Date()): string {
  const offset = (((hour - now.getUTCHours()) % 24) + 36) % 24 - 12; // −12..+11
  return offset === 0 ? 'Etc/GMT' : `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
}

describe('Notification rules (NOTIF-001 toggles, quiet hours, daily cap, daily_set_ready)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  async function pair() {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.post('/v1/devices').set(bearer(a.token)).send({ token: sub(1), platform: 'web' }).expect(204);
    await ctx.http.post('/v1/devices').set(bearer(b.token)).send({ token: sub(2), platform: 'web' }).expect(204);
    return { a, b };
  }

  it('settings expose toggles; a type turned off still lands in the in-app centre but is not pushed', async () => {
    const { a, b } = await pair();
    const me = await ctx.http.patch('/v1/me').set(bearer(a.token)).send({ notifications: { new_match: false }, timezone: zoneAt(14) }).expect(200);
    expect(me.body.settings.notifications).toMatchObject({ new_match: false, new_message: true });
    await ctx.http.patch('/v1/me').set(bearer(b.token)).send({ timezone: zoneAt(14) }).expect(200);
    await ctx.http.patch('/v1/me').set(bearer(a.token)).send({ timezone: 'Mars/Olympus' }).expect(400);
    await ctx.http.patch('/v1/me').set(bearer(a.token)).send({ notifications: { marketing: true } }).expect(400);
    await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(b.token)).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' }).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' }).expect(200);
    await ctx.pushService.flush();
    expect(await ctx.prisma.notification.count({ where: { type: 'new_match' } })).toBe(2);
    expect(ctx.push.sent.filter((s) => s.msg.data.type === 'new_match').map((s) => s.target)).toEqual([expect.stringContaining('abc2')]);
  });

  it('quiet hours hold matches but let messages through', async () => {
    const { a, b } = await pair();
    for (const u of [a, b]) await ctx.http.patch('/v1/me').set(bearer(u.token)).send({ timezone: zoneAt(2) }).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(b.token)).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' }).expect(200);
    const m = await ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' }).expect(200);
    await ctx.http.post(`/v1/matches/${m.body.match.id}/messages`).set(bearer(a.token)).send({ clientMessageId: randomUUID(), body: 'hi' }).expect(201);
    await ctx.pushService.flush();
    expect(ctx.push.sent.map((s) => s.msg.data.type)).toEqual(['new_message']);
  });

  it('announces Today’s Souls once per day after 12:00 local, and reminders share one push per day', async () => {
    const { a, b } = await pair();
    for (const u of [a, b]) await ctx.http.patch('/v1/me').set(bearer(u.token)).send({ timezone: zoneAt(13) }).expect(200);
    const daily = ctx.app.get(DailySetService);
    expect(await daily.announceDue()).toBe(2);
    expect(await daily.announceDue()).toBe(0);
    await ctx.pushService.flush();
    expect(ctx.push.sent.filter((s) => s.msg.data.type === 'daily_set_ready')).toHaveLength(2);
    expect(await ctx.prisma.notification.count({ where: { type: 'daily_set_ready' } })).toBe(2);

    // A second non-conversation notification the same day is stored but not pushed.
    ctx.push.sent = [];
    await ctx.app.get(NotificationsService).notify(a.userId, 'open_ending', { sessionId: randomUUID() });
    await ctx.pushService.flush();
    expect(ctx.push.sent).toHaveLength(0);
    expect(await ctx.prisma.notification.count({ where: { userId: a.userId, type: 'open_ending' } })).toBe(1);
  });

  it('does not announce before noon or to someone who already opened today’s set', async () => {
    const { a, b } = await pair();
    await ctx.http.patch('/v1/me').set(bearer(a.token)).send({ timezone: zoneAt(10) }).expect(200);
    await ctx.http.patch('/v1/me').set(bearer(b.token)).send({ timezone: zoneAt(15) }).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(b.token)).expect(200);
    expect(await ctx.app.get(DailySetService).announceDue()).toBe(0);
  });
});
