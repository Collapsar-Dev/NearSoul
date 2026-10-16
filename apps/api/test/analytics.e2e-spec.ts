import { AnalyticsService, sanitize } from '../src/modules/analytics/analytics.service';
import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

const settle = () => new Promise((r) => setTimeout(r, 150));

describe('Analytics (ANL-001)', () => {
  let ctx: TestCtx;
  let analytics: AnalyticsService;
  beforeAll(async () => {
    ctx = await createTestApp();
    analytics = ctx.app.get(AnalyticsService);
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => {
    await resetDb(ctx);
    analytics.captured.length = 0;
  });

  it('drops PII and free text, keeps allowlisted codes', () => {
    expect(sanitize({ email: 'a@b.c', lat: 52.3, text: 'hello world', tier: 'strong', topic: 'values', count: 3, comment: 'x' })).toEqual({ tier: 'strong', topic: 'values', count: 3 });
    expect(sanitize({ category: 'I feel sad today' })).toEqual({});
  });

  it('sends nothing without analytics consent', async () => {
    await onboard(ctx, 'anna@example.com');
    await settle();
    expect(analytics.captured).toHaveLength(0);
  });

  it('tracks events with a random analytics id once consent is given', async () => {
    const u = await onboard(ctx, 'anna@example.com');
    await ctx.http.post('/v1/me/consents').set(bearer(u.token)).send({ optional: { analytics: true } }).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(u.token)).expect(200);
    await settle();
    const names = analytics.captured.map((e) => e.event);
    expect(names).toContain('daily_set_viewed');
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: u.userId } });
    expect(analytics.captured.every((e) => e.distinctId === user.analyticsId && e.distinctId !== user.id)).toBe(true);
    expect(JSON.stringify(analytics.captured)).not.toContain('anna@example.com');
  });
});
