import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { authenticator } from 'otplib';
import { DemoService } from '../src/modules/alpha/demo.service';
import { RetentionService } from '../src/modules/jobs/retention.service';
import { NearbyService } from '../src/modules/nearby/nearby.service';
import { bearer, createTestApp, lastCode, onboard, resetDb, type TestCtx } from './helpers/app';

const FORBIDDEN_GEO = /"(lat|lng|h3Cell|cell|distanceM|distance_m)"\s*:/;

describe('Nearby Now (GEO-001..007, ALPHA-003)', () => {
  let ctx: TestCtx;
  let nearby: NearbyService;
  beforeAll(async () => {
    ctx = await createTestApp();
    nearby = ctx.app.get(NearbyService);
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  async function two() {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    return { a, b };
  }

  it('alerts both open, compatible users within radius exactly once, without exposing coordinates', async () => {
    const { a, b } = await two();
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 120, radiusM: 1000, activity: 'coffee' }).expect(200);
    await ctx.http.post('/v1/nearby/open').set(bearer(b.token)).send({ durationMin: 60, radiusM: 1000 }).expect(200);
    await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.3731, lng: 4.8926, accuracyM: 20 }).expect(200);
    await ctx.http.post('/v1/location').set(bearer(b.token)).send({ lat: 52.3770, lng: 4.8990, accuracyM: 20 }).expect(200); // ~600 m
    await nearby.deliverDue();
    expect(await ctx.prisma.notification.count({ where: { type: 'nearby_alert' } })).toBe(2);
    // stored location is the H3 cell centre, not the raw point
    const loc = await ctx.prisma.userLocation.findUniqueOrThrow({ where: { userId: a.userId } });
    expect(loc.lat).not.toBe(52.3731);
    const list = await ctx.http.get('/v1/nearby/list').set(bearer(b.token)).expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].profile.distanceBand).toBe('Under 1 km');
    expect(list.body.items[0].profile.activity).toBe('coffee');
    expect(JSON.stringify(list.body)).not.toMatch(FORBIDDEN_GEO);
    // no second alert for the same pair within 7 days
    await nearby.matchFor(a.userId);
    await nearby.deliverDue();
    expect(await ctx.prisma.nearbyAlert.count()).toBe(1);
    // nearby like → match flagged as nearby
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like', source: 'nearby' }).expect(200);
    const m = await ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like', source: 'nearby' }).expect(200);
    expect(m.body.match.nearby).toBe(true);
  });

  it('no alert when out of radius, blocked, or not open', async () => {
    const { a, b } = await two();
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 500 }).expect(200);
    await ctx.http.post('/v1/nearby/open').set(bearer(b.token)).send({ durationMin: 60, radiusM: 10000 }).expect(200);
    await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.3731, lng: 4.8926, accuracyM: 20 }).expect(200);
    await ctx.http.post('/v1/location').set(bearer(b.token)).send({ lat: 52.3800, lng: 4.9100, accuracyM: 20 }).expect(200); // ~1.4 km > 500 m
    await nearby.deliverDue();
    expect(await ctx.prisma.nearbyAlert.count()).toBe(0);
    await ctx.http.post('/v1/blocks').set(bearer(a.token)).send({ userId: b.userId }).expect(204);
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 10000 }).expect(200);
    await nearby.matchFor(a.userId);
    expect(await ctx.prisma.nearbyAlert.count()).toBe(0);
  });

  it('rejects inaccurate locations and limits Open sessions', async () => {
    const { a } = await two();
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 1000 }).expect(200);
    const r = await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.37, lng: 4.89, accuracyM: 900 });
    expect(r.body.error.code).toBe('LOCATION_INACCURATE');
    expect((await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 100 })).body.error.code).toBe('INVALID_RADIUS');
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 1000 }).expect(200);
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 1000 }).expect(200);
    expect((await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 1000 })).body.error.code).toBe('OPEN_LIMIT');
  });

  it('the server ends expired windows and deletes the location when discovery is off', async () => {
    const a = await onboard(ctx, 'anna@example.com', { discovery: false });
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 1000 }).expect(200);
    await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.37, lng: 4.89, accuracyM: 30 }).expect(200);
    await ctx.prisma.nearbySession.updateMany({ data: { openUntil: new Date(Date.now() - 1000) } });
    await nearby.housekeeping();
    expect((await ctx.http.get('/v1/nearby/status').set(bearer(a.token))).body.open).toBe(false);
    expect(await ctx.prisma.userLocation.count()).toBe(0);
  });

  it('alpha simulator is tester-only', async () => {
    const { a } = await two();
    await ctx.http.post('/v1/alpha/location').set(bearer(a.token)).send({ presetId: 'dam' }).expect(404);
    await ctx.prisma.user.update({ where: { id: a.userId }, data: { role: 'tester' } });
    await ctx.http.post('/v1/nearby/open').set(bearer(a.token)).send({ durationMin: 60, radiusM: 1000 }).expect(200);
    const r = await ctx.http.post('/v1/alpha/location').set(bearer(a.token)).send({ presetId: 'dam' }).expect(200);
    expect(r.body.simulated).toBe(true);
  });
});

describe('Demo profiles (ALPHA-002)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('demo profiles like back and reply exactly once', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const demo = await onboard(ctx, 'demo1@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.prisma.user.update({ where: { id: demo.userId }, data: { isDemo: true } });
    const set = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    expect(set.body.cards[0].isDemo).toBe(true);
    ctx.app.get(DemoService).forceLikeBack = true;
    const like = await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: demo.userId, action: 'like' }).expect(200);
    expect(like.body.match.id).toBeDefined();
    const matchId = like.body.match.id;
    await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).send({ clientMessageId: randomUUID(), body: 'hi' }).expect(201);
    await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).send({ clientMessageId: randomUUID(), body: 'hello?' }).expect(201);
    const msgs = await ctx.http.get(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).expect(200);
    expect(msgs.body.items.filter((m: { fromMe: boolean }) => !m.fromMe)).toHaveLength(1);
    ctx.app.get(DemoService).forceLikeBack = null;
  });
});

describe('Admin (§15, SAFE-004) and deletion (ACC-003)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  async function adminToken(role: 'moderator' | 'support' | 'admin') {
    const secret = authenticator.generateSecret();
    const email = `${role}@nearsoul.test`;
    await ctx.prisma.adminUser.create({ data: { email, role, passwordHash: await argon2.hash('correct horse battery'), mfaSecret: secret } });
    const r = await ctx.http.post('/admin/v1/login').send({ email, password: 'correct horse battery', totp: authenticator.generate(secret) }).expect(200);
    return r.body.token as string;
  }

  it('requires password + TOTP, rejects user tokens and wrong roles', async () => {
    const secret = authenticator.generateSecret();
    await ctx.prisma.adminUser.create({ data: { email: 'x@nearsoul.test', role: 'admin', passwordHash: await argon2.hash('correct horse battery'), mfaSecret: secret } });
    await ctx.http.post('/admin/v1/login').send({ email: 'x@nearsoul.test', password: 'correct horse battery', totp: '000000' }).expect(401);
    const user = await onboard(ctx, 'anna@example.com');
    await ctx.http.get('/admin/v1/queue').set(bearer(user.token)).expect(401);
    const support = await adminToken('support');
    await ctx.http.get('/admin/v1/queue').set(bearer(support)).expect(403);
  });

  it('moderators resolve cases (audited) but cannot suspend; admins can', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const rep = await ctx.http.post('/v1/reports-moderation').set(bearer(a.token)).send({ userId: b.userId, category: 'harassment', comment: 'rude' }).expect(201);
    const mod = await adminToken('moderator');
    const queue = await ctx.http.get('/admin/v1/queue').set(bearer(mod)).expect(200);
    expect(queue.body[0].id).toBe(rep.body.id);
    const c = await ctx.http.get(`/admin/v1/cases/${rep.body.id}`).set(bearer(mod)).expect(200);
    expect(JSON.stringify(c.body)).not.toMatch(/"(answers|profile|soul|traits|score|email)"\s*:/);
    const denied = await ctx.http.post(`/admin/v1/cases/${rep.body.id}/resolve`).set(bearer(mod)).send({ action: 'suspend', reason: 'repeat offender' });
    expect(denied.body.error.code).toBe('ROLE');
    await ctx.http.post(`/admin/v1/cases/${rep.body.id}/resolve`).set(bearer(mod)).send({ action: 'warn', reason: 'first warning' }).expect(200);
    expect(await ctx.prisma.auditEvent.count({ where: { action: 'moderation_warn' } })).toBe(1);
    const admin = await adminToken('admin');
    await ctx.http.post(`/admin/v1/users/${b.userId}/actions`).set(bearer(admin)).send({ action: 'suspend', reason: 'threats' }).expect(200);
    await ctx.http.get('/v1/me').set(bearer(b.token)).expect(401);
    const inv = await ctx.http.post('/admin/v1/invites').set(bearer(admin)).send({ count: 3, maxUses: 2 }).expect(201);
    expect(inv.body.codes).toHaveLength(3);
  });

  it('exposes no admin route for Soul Talk data or raw engine answers (route inventory)', () => {
    const http = ctx.app.getHttpAdapter().getInstance();
    const router = http.router ?? http._router; // Express 5 / 4
    const paths: string[] = (router?.stack ?? []).filter((l: { route?: { path: string } }) => l.route).map((l: { route: { path: string } }) => l.route.path);
    const adminPaths = paths.filter((p) => p.startsWith('/admin'));
    expect(adminPaths.length).toBeGreaterThan(5);
    expect(adminPaths.filter((p) => /soul|answer|engine|report\b/i.test(p))).toEqual([]);
  });

  it('deletion job removes the account, photos and ends matches', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    await ctx.http.post('/v1/me/sensitive-code').set(bearer(a.token)).expect(202);
    await ctx.http.post('/v1/me/delete').set(bearer(a.token)).send({ code: lastCode(ctx, 'anna@example.com') }).expect(202);
    await ctx.app.get(RetentionService).processDeletions();
    expect(await ctx.prisma.user.count({ where: { id: a.userId } })).toBe(0);
    expect(await ctx.prisma.photo.count({ where: { userId: a.userId } })).toBe(0);
    expect(await ctx.prisma.auditEvent.count({ where: { action: 'account_deleted', targetId: a.userId } })).toBe(1);
  });
});
