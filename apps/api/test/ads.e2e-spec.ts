import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

describe('Sponsored cards (CR-25): free and Soul+ see ads, Gold and VIP do not', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => {
    await resetDb(ctx);
    await ctx.prisma.adCard.deleteMany();
    await ctx.prisma.adCard.create({ data: { title: { en: 'T', ru: 'Т' }, body: { en: 'B', ru: 'Б' }, cta: { en: 'Go', ru: 'Вперёд' }, url: 'https://example.com', sponsor: 'Test', isTest: true } });
  });

  it('shows localized test ads to free users, none to Gold/VIP; counts only aggregates', async () => {
    const anna = await onboard(ctx, 'anna@example.com');
    const free = await ctx.http.get('/v1/ads').set(bearer(anna.token)).set('accept-language', 'ru').expect(200);
    expect(free.body.every).toBe(10);
    expect(free.body.ads).toHaveLength(1);
    expect(free.body.ads[0]).toMatchObject({ title: 'Т', cta: 'Вперёд', isTest: true });
    const id = free.body.ads[0].id as string;
    await ctx.http.post(`/v1/ads/${id}/impression`).set(bearer(anna.token)).expect(204);
    await ctx.http.post(`/v1/ads/${id}/click`).set(bearer(anna.token)).expect(204);
    expect(await ctx.prisma.adCard.findUnique({ where: { id } })).toMatchObject({ impressions: 1, clicks: 1 });

    await ctx.http.post('/v1/billing/test-activate').set(bearer(anna.token)).send({ tier: 'plus' }).expect(200);
    expect((await ctx.http.get('/v1/ads').set(bearer(anna.token))).body.ads).toHaveLength(1);
    for (const tier of ['gold', 'vip']) {
      const s = await ctx.http.post('/v1/billing/test-activate').set(bearer(anna.token)).send({ tier }).expect(200);
      expect(s.body.features.showAds).toBe(false);
      expect((await ctx.http.get('/v1/ads').set(bearer(anna.token))).body.ads).toHaveLength(0);
    }
  });
});
