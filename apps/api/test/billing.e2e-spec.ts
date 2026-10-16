import { bearer, createTestApp, onboard, quickScanAnswers, resetDb, type TestCtx } from './helpers/app';

const AUTH = 'rc-webhook-secret-0123456789';

describe('Billing / Soul+ (PAY-001..003)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ PAYWALL_ENABLED: 'true', REVENUECAT_WEBHOOK_AUTH: AUTH });
  });
  afterAll(async () => {
    process.env.PAYWALL_ENABLED = 'false';
    delete process.env.REVENUECAT_WEBHOOK_AUTH;
    await ctx.app.close();
  });
  beforeEach(async () => resetDb(ctx));

  const hook = (event: Record<string, unknown>, auth = AUTH) => ctx.http.post('/v1/billing/webhook').set('authorization', auth).send({ api_version: '1.0', event });

  it('rejects webhooks without the shared secret', async () => {
    await hook({ id: 'e0', type: 'TEST' }, 'wrong-secret-wrong-secret').expect(401);
    await ctx.http.post('/v1/billing/webhook').send({ event: { id: 'e0', type: 'TEST' } }).expect(401);
  });

  it('a purchase unlocks full reports server-side; expiration locks them again; events are idempotent', async () => {
    const u = await onboard(ctx, 'anna@example.com', { answers: quickScanAnswers() });
    const status = await ctx.http.get('/v1/billing/status').set(bearer(u.token)).expect(200);
    expect(status.body.soulPlus.active).toBe(false);
    expect((await ctx.http.get('/v1/reports/self').set(bearer(u.token))).body.full).toBe(false);
    const purchase = { id: 'evt-1', type: 'INITIAL_PURCHASE', app_user_id: status.body.billingId, product_id: 'soul_plus_monthly', entitlement_ids: ['soul_plus'], expiration_at_ms: Date.now() + 30 * 86_400_000, environment: 'SANDBOX', store: 'PLAY_STORE' };
    expect((await hook(purchase).expect(200)).body.status).toBe('processed');
    expect((await hook(purchase).expect(200)).body.status).toBe('duplicate');
    const after = await ctx.http.get('/v1/reports/self').set(bearer(u.token)).expect(200);
    expect(after.body.full).toBe(true);
    expect(after.body.freeDuringBeta).toBe(false);
    expect((await ctx.http.get('/v1/billing/status').set(bearer(u.token))).body.soulPlus.active).toBe(true);
    await hook({ ...purchase, id: 'evt-2', type: 'CANCELLATION' }).expect(200);
    expect((await ctx.http.get('/v1/billing/status').set(bearer(u.token))).body.soulPlus.active).toBe(true); // until expiry
    await hook({ ...purchase, id: 'evt-3', type: 'EXPIRATION', expiration_at_ms: Date.now() - 1000 }).expect(200);
    expect((await ctx.http.get('/v1/reports/self').set(bearer(u.token))).body.full).toBe(false);
  });

  it('a client cannot claim premium: unknown users and unrelated products are ignored', async () => {
    const u = await onboard(ctx, 'anna@example.com');
    expect((await hook({ id: 'x1', type: 'INITIAL_PURCHASE', app_user_id: 'not-a-billing-id', entitlement_ids: ['soul_plus'] }).expect(200)).body.status).toBe('ignored');
    const { body } = await ctx.http.get('/v1/billing/status').set(bearer(u.token));
    expect((await hook({ id: 'x2', type: 'INITIAL_PURCHASE', app_user_id: body.billingId, product_id: 'boost_pack', entitlement_ids: [] }).expect(200)).body.status).toBe('ignored');
    expect((await ctx.http.get('/v1/billing/status').set(bearer(u.token))).body.soulPlus.active).toBe(false);
  });
});
