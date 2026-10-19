import argon2 from 'argon2';
import { authenticator } from 'otplib';
import { poseFor, POSES } from '../src/modules/profile/verification.service';
import { bearer, createTestApp, onboard, resetDb, testJpeg, type TestCtx } from './helpers/app';

describe('Photo verification by selfie (CR-30)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  async function moderator() {
    const secret = authenticator.generateSecret();
    await ctx.prisma.adminUser.create({ data: { email: 'mod@nearsoul.test', role: 'moderator', passwordHash: await argon2.hash('correct horse battery'), mfaSecret: secret } });
    const r = await ctx.http.post('/admin/v1/login').send({ email: 'mod@nearsoul.test', password: 'correct horse battery', totp: authenticator.generate(secret) }).expect(200);
    return { authorization: `Bearer ${r.body.token as string}` };
  }

  it('selfie with today’s pose → moderator approves → badge on the public profile; selfie deleted', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const s = await ctx.http.get('/v1/me/verification').set(bearer(a.token)).expect(200);
    expect(s.body).toMatchObject({ verified: false, pending: false, autoApprove: false });
    expect(POSES).toContain(s.body.pose);

    // wrong pose is refused
    await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', POSES.find((p) => p !== s.body.pose)!).attach('selfie', await testJpeg(3), 's.jpg').expect(400);
    const sent = await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', poseFor(a.userId)).attach('selfie', await testJpeg(3), 's.jpg').expect(201);
    expect(sent.body.pending).toBe(true);
    // a second one while pending is refused
    await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', poseFor(a.userId)).attach('selfie', await testJpeg(4), 's.jpg').expect(409);

    // users can't reach the moderator queue
    await ctx.http.get('/admin/v1/verifications').set(bearer(a.token)).expect(401);
    const mod = await moderator();
    const q = await ctx.http.get('/admin/v1/verifications').set(mod).expect(200);
    expect(q.body).toHaveLength(1);
    expect(q.body[0].selfie).toBeTruthy();
    expect(q.body[0].photos.length).toBeGreaterThan(0);
    await ctx.http.post(`/admin/v1/verifications/${q.body[0].id}/decide`).set(mod).send({ approve: true }).expect(200);

    const row = await ctx.prisma.photoVerification.findFirstOrThrow({ where: { userId: a.userId } });
    expect(row.status).toBe('approved');
    expect(row.storageKey).toBeNull(); // selfie gone
    expect((await ctx.http.get('/v1/me').set(bearer(a.token))).body.verified).toBe(true);
    expect(await ctx.prisma.notification.count({ where: { userId: a.userId, type: 'verification_result' } })).toBe(1);

    // others see the badge, never the selfie
    await ctx.prisma.dailySet.deleteMany();
    await ctx.http.get('/v1/daily-set').set(bearer(b.token)).expect(200);
    const p = await ctx.http.get(`/v1/profiles/${a.userId}`).set(bearer(b.token)).expect(200);
    expect(p.body.verified).toBe(true);
    expect(JSON.stringify(p.body)).not.toContain('verifications/');
  });

  it('rejection keeps the account unverified, limits attempts and needs a profile photo', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const mod = await moderator();
    const pose = poseFor(a.userId);
    await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', pose).attach('selfie', await testJpeg(1), 's.jpg').expect(201);
    const [v] = (await ctx.http.get('/admin/v1/verifications').set(mod)).body;
    await ctx.http.post(`/admin/v1/verifications/${v.id}/decide`).set(mod).send({ approve: false, reason: 'pose_missing' }).expect(200);
    const s = (await ctx.http.get('/v1/me/verification').set(bearer(a.token))).body;
    expect(s).toMatchObject({ verified: false, pending: false, lastResult: { status: 'rejected', reason: 'pose_missing' } });
    for (let i = 0; i < 2; i++) {
      await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', pose).attach('selfie', await testJpeg(i), 's.jpg').expect(201);
      const [p] = (await ctx.http.get('/admin/v1/verifications').set(mod)).body;
      await ctx.http.post(`/admin/v1/verifications/${p.id}/decide`).set(mod).send({ approve: false }).expect(200);
    }
    expect((await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', pose).attach('selfie', await testJpeg(9), 's.jpg')).status).toBe(429);

    await ctx.prisma.photo.deleteMany({ where: { userId: a.userId } });
    await ctx.prisma.photoVerification.deleteMany();
    expect((await ctx.http.post('/v1/me/verification').set(bearer(a.token)).field('pose', pose).attach('selfie', await testJpeg(9), 's.jpg')).body.error.code).toBe('NO_PHOTOS');
  });
});
