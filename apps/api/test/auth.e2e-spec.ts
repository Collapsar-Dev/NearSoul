import { bearer, createTestApp, lastCode, resetDb, signIn, type TestCtx } from './helpers/app';

describe('Auth (AUTH-001..004, ALPHA-001)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ INVITE_ONLY: 'false' });
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('CSP lets the web image picker read the chosen photo (blob:) but nothing else from other origins', async () => {
    const csp = (await ctx.http.get('/health')).headers['content-security-policy'] as string;
    expect(csp).toContain("connect-src 'self' blob: data:");
    expect(csp).toContain("frame-ancestors 'self'");
    expect((await ctx.http.get('/v1/me')).headers['cache-control']).toBe('no-store');
  });

  it('returns identical responses for known and unknown emails (no enumeration)', async () => {
    await signIn(ctx, 'known@example.com');
    ctx.limiter.reset();
    const a = await ctx.http.post('/v1/auth/code').send({ email: 'unknown@example.com' });
    await ctx.prisma.authCode.deleteMany({ where: { email: 'known@example.com' } });
    const b = await ctx.http.post('/v1/auth/code').send({ email: 'known@example.com' });
    expect(a.status).toBe(202);
    expect(b.status).toBe(202);
    expect(a.body).toEqual(b.body);
    expect(a.body).toEqual({ status: 'sent' }); // codes are only ever returned in the alpha on-screen mode
  });

  it('normalizes emails and creates the account on first verify', async () => {
    const { userId } = await signIn(ctx, '  Mixed@Example.COM ');
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.email).toBe('mixed@example.com');
    expect(user.status).toBe('onboarding');
  });

  it('enforces the resend cooldown and the 3-per-15-min limit', async () => {
    await ctx.http.post('/v1/auth/code').send({ email: 'x@example.com' }).expect(202);
    const second = await ctx.http.post('/v1/auth/code').send({ email: 'x@example.com' });
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('RATE_LIMITED');
    expect(second.headers['retry-after']).toBeDefined();
    // simulate time passing beyond the cooldown but inside the window
    await ctx.prisma.authCode.updateMany({ data: { createdAt: new Date(Date.now() - 2 * 60_000) } });
    await ctx.http.post('/v1/auth/code').send({ email: 'x@example.com' }).expect(202);
    await ctx.prisma.authCode.updateMany({ data: { createdAt: new Date(Date.now() - 2 * 60_000) } });
    await ctx.http.post('/v1/auth/code').send({ email: 'x@example.com' }).expect(202);
    await ctx.prisma.authCode.updateMany({ data: { createdAt: new Date(Date.now() - 2 * 60_000) } });
    expect((await ctx.http.post('/v1/auth/code').send({ email: 'x@example.com' })).status).toBe(429);
  });

  it('invalidates a code after 5 wrong attempts', async () => {
    await ctx.http.post('/v1/auth/code').send({ email: 'y@example.com' }).expect(202);
    const code = lastCode(ctx, 'y@example.com');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      const r = await ctx.http.post('/v1/auth/verify').send({ email: 'y@example.com', code: wrong });
      expect(r.body.error.code).toBe('INVALID_CODE');
    }
    await ctx.http.post('/v1/auth/verify').send({ email: 'y@example.com', code }).expect(400);
  });

  it('rejects reuse and expired codes', async () => {
    await ctx.http.post('/v1/auth/code').send({ email: 'z@example.com' }).expect(202);
    const code = lastCode(ctx, 'z@example.com');
    await ctx.http.post('/v1/auth/verify').send({ email: 'z@example.com', code }).expect(200);
    await ctx.http.post('/v1/auth/verify').send({ email: 'z@example.com', code }).expect(400);
    await ctx.prisma.authCode.deleteMany();
    ctx.limiter.reset();
    await ctx.http.post('/v1/auth/code').send({ email: 'z@example.com' }).expect(202);
    await ctx.prisma.authCode.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await ctx.http.post('/v1/auth/verify').send({ email: 'z@example.com', code: lastCode(ctx, 'z@example.com') }).expect(400);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const { refreshToken } = await signIn(ctx, 'r@example.com');
    const r1 = await ctx.http.post('/v1/auth/refresh').send({ refreshToken }).expect(200);
    expect(r1.body.refreshToken).not.toBe(refreshToken);
    // reuse the old token → whole family revoked, including the fresh one
    await ctx.http.post('/v1/auth/refresh').send({ refreshToken }).expect(401);
    await ctx.http.post('/v1/auth/refresh').send({ refreshToken: r1.body.refreshToken }).expect(401);
    expect(await ctx.prisma.auditEvent.count({ where: { action: 'refresh_token_reuse' } })).toBeGreaterThanOrEqual(1);
    expect(await ctx.prisma.session.count({ where: { revokedAt: null } })).toBe(0);
  });

  it('web clients get an httpOnly cookie and must send the CSRF header', async () => {
    await ctx.http.post('/v1/auth/code').send({ email: 'w@example.com' }).expect(202);
    const res = await ctx.http.post('/v1/auth/verify').set('x-client', 'web').send({ email: 'w@example.com', code: lastCode(ctx, 'w@example.com') }).expect(200);
    expect(res.body.refreshToken).toBeUndefined();
    const cookie = res.headers['set-cookie']?.[0] as string;
    expect(cookie).toMatch(/ns_refresh=.+HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    await ctx.http.post('/v1/auth/refresh').set('x-client', 'web').set('cookie', cookie.split(';')[0]!).expect(403);
    await ctx.http.post('/v1/auth/refresh').set('x-client', 'web').set('x-requested-with', 'NearSoul').set('cookie', cookie.split(';')[0]!).expect(200);
  });

  it('logout revokes the session; protected routes need a token', async () => {
    const { token, refreshToken } = await signIn(ctx, 'l@example.com');
    await ctx.http.get('/v1/me').expect(401);
    await ctx.http.get('/v1/me').set(bearer(token)).expect(200);
    await ctx.http.post('/v1/auth/logout').set(bearer(token)).expect(204);
    await ctx.http.post('/v1/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('a failed email send returns a clear error and does not consume the resend quota', async () => {
    const original = ctx.email.send.bind(ctx.email);
    ctx.email.send = async () => {
      throw new Error('EMAIL_SEND_FAILED');
    };
    const r = await ctx.http.post('/v1/auth/code').send({ email: 'down@example.com' });
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('EMAIL_UNAVAILABLE');
    ctx.email.send = original;
    await ctx.http.post('/v1/auth/code').send({ email: 'down@example.com' }).expect(202);
  });

  it('rejects unknown fields (no mass assignment)', async () => {
    const r = await ctx.http.post('/v1/auth/code').send({ email: 'a@example.com', role: 'admin' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_FAILED');
    expect(r.body.error.request_id).toBeDefined();
  });
});

describe('Invite-only (ALPHA-001)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ INVITE_ONLY: 'true' });
  });
  afterAll(async () => {
    process.env.INVITE_ONLY = 'false';
    await ctx.app.close();
  });
  beforeEach(async () => resetDb(ctx));

  it('requires a valid invite for new accounts and gives each tester 3 invites', async () => {
    await ctx.http.post('/v1/auth/code').send({ email: 'new@example.com' }).expect(202);
    const r = await ctx.http.post('/v1/auth/verify').send({ email: 'new@example.com', code: lastCode(ctx, 'new@example.com') });
    expect(r.body.error.code).toBe('INVITE_REQUIRED');
    const invite = await ctx.prisma.invite.create({ data: { code: 'ABCD2345', maxUses: 1, createdByAdmin: true } });
    await ctx.prisma.authCode.deleteMany();
    ctx.limiter.reset();
    const { token } = await signIn(ctx, 'new@example.com', { inviteCode: 'abcd2345' });
    expect((await ctx.prisma.invite.findUniqueOrThrow({ where: { id: invite.id } })).uses).toBe(1);
    const mine = await ctx.http.get('/v1/me/invites').set(bearer(token)).expect(200);
    expect(mine.body.invitesLeft).toBe(3);
    const created = await ctx.http.post('/v1/me/invites').set(bearer(token)).expect(201);
    expect(created.body.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });

  it('rejects a used single-use code', async () => {
    await ctx.prisma.invite.create({ data: { code: 'USED2345', maxUses: 1, uses: 1, createdByAdmin: true } });
    await ctx.http.post('/v1/auth/code').send({ email: 'late@example.com' }).expect(202);
    const r = await ctx.http.post('/v1/auth/verify').send({ email: 'late@example.com', code: lastCode(ctx, 'late@example.com'), inviteCode: 'USED2345' });
    expect(r.body.error.code).toBe('INVALID_INVITE');
    expect(await ctx.prisma.user.count()).toBe(0);
  });

  it('validates codes publicly', async () => {
    await ctx.prisma.invite.create({ data: { code: 'GOOD2345', maxUses: 2, createdByAdmin: true } });
    expect((await ctx.http.post('/v1/invites/validate').send({ code: 'good2345' })).body.valid).toBe(true);
    expect((await ctx.http.post('/v1/invites/validate').send({ code: 'NOPE2345' })).body.valid).toBe(false);
  });
});
