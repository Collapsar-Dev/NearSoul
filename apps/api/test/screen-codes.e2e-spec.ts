import { resetEnvCache } from '../src/config/env';
import { bearer, createTestApp, resetDb, type TestCtx } from './helpers/app';

describe('Alpha on-screen codes (EMAIL_PROVIDER=screen)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ EMAIL_PROVIDER: 'screen', INVITE_ONLY: 'false' });
  });
  afterAll(async () => {
    await ctx.app.close();
    process.env.EMAIL_PROVIDER = 'console';
    resetEnvCache();
  });
  beforeEach(async () => resetDb(ctx));

  it('returns the sign-in code to the app instead of emailing it, and the code works', async () => {
    const res = await ctx.http.post('/v1/auth/code').send({ email: 'Friend@Example.com' }).expect(202);
    expect(res.body.testCode).toMatch(/^\d{6}$/);
    expect(ctx.email.outbox.size).toBe(0);
    const v = await ctx.http.post('/v1/auth/verify').send({ email: 'friend@example.com', code: res.body.testCode }).expect(200);
    expect(v.body.accessToken).toBeDefined();
    // the usual protections still apply
    await ctx.http.post('/v1/auth/code').send({ email: 'friend@example.com' }).expect(429);
  });

  it('returns the confirmation code for account deletion too', async () => {
    const c = await ctx.http.post('/v1/auth/code').send({ email: 'friend@example.com' }).expect(202);
    const v = await ctx.http.post('/v1/auth/verify').send({ email: 'friend@example.com', code: c.body.testCode }).expect(200);
    const s = await ctx.http.post('/v1/me/sensitive-code').set(bearer(v.body.accessToken)).expect(202);
    expect(s.body.testCode).toMatch(/^\d{6}$/);
  });
});
