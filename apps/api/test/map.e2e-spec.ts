import { latLngToCell } from 'h3-js';
import { MapService, MAP_RES } from '../src/modules/nearby/map.service';
import { pair } from '../src/modules/matches/likes.service';
import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

describe('Map for matches (CR-29)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  async function setup() {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const c = await onboard(ctx, 'carl@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.prisma.match.create({ data: { ...pair(a.userId, b.userId), source: 'daily' } });
    await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.3731, lng: 4.8926, accuracyM: 20 }).expect(200);
    for (const u of [b, c]) {
      await ctx.http.post('/v1/map/share').set(bearer(u.token)).send({ durationMin: 60 }).expect(200);
      await ctx.http.post('/v1/location').set(bearer(u.token)).send({ lat: 52.3770, lng: 4.8990, accuracyM: 20 }).expect(200);
    }
    return { a, b, c };
  }

  it('shows only matches who share, as an approximate area with a rounded distance', async () => {
    const { a, b } = await setup();
    const r = await ctx.http.get('/v1/map').set(bearer(a.token)).expect(200);
    expect(r.body.sharing).toBeNull();
    expect(r.body.friends).toHaveLength(1); // carl shares too but is not a match
    const f = r.body.friends[0];
    expect(f.userId).toBe(b.userId);
    expect(f.approxM % 100).toBe(0);
    // the spot is the centre of a coarse (res 8) cell, not the stored res 9 centre
    const stored = await ctx.prisma.userLocation.findUniqueOrThrow({ where: { userId: b.userId } });
    expect(f.lat).not.toBe(stored.lat);
    expect(latLngToCell(f.lat, f.lng, MAP_RES)).toBe(latLngToCell(stored.lat, stored.lng, MAP_RES));
    expect(JSON.stringify(r.body)).not.toMatch(/"(h3Cell|cell|distanceM)"\s*:/);
    // b does not see a: a never turned sharing on
    expect((await ctx.http.get('/v1/map').set(bearer(b.token)).expect(200)).body.friends).toHaveLength(0);
  });

  it('disappears when sharing stops, expires, or after a block', async () => {
    const { a, b } = await setup();
    await ctx.http.post('/v1/map/stop').set(bearer(b.token)).expect(200);
    expect((await ctx.http.get('/v1/map').set(bearer(a.token))).body.friends).toHaveLength(0);

    await ctx.http.post('/v1/map/share').set(bearer(b.token)).send({ durationMin: null }).expect(200);
    expect((await ctx.http.get('/v1/map').set(bearer(a.token))).body.friends).toHaveLength(1);
    await ctx.prisma.mapShare.update({ where: { userId: b.userId }, data: { until: new Date(Date.now() - 1000) } });
    expect((await ctx.http.get('/v1/map').set(bearer(a.token))).body.friends).toHaveLength(0);
    await ctx.app.get(MapService).housekeeping();
    expect(await ctx.prisma.mapShare.count({ where: { userId: b.userId } })).toBe(0);

    await ctx.http.post('/v1/map/share').set(bearer(b.token)).send({ durationMin: 240 }).expect(200);
    await ctx.http.post('/v1/blocks').set(bearer(a.token)).send({ userId: b.userId }).expect(204);
    expect((await ctx.http.get('/v1/map').set(bearer(a.token))).body.friends).toHaveLength(0);
  });

  it('only allows 1 h, 4 h or until turned off, and lets a sharer update location with discovery off', async () => {
    const a = await onboard(ctx, 'anna@example.com', { discovery: false });
    expect((await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.37, lng: 4.89, accuracyM: 20 })).body.error.code).toBe('LOCATION_NOT_NEEDED');
    await ctx.http.post('/v1/map/share').set(bearer(a.token)).send({ durationMin: 30 }).expect(400);
    const s = await ctx.http.post('/v1/map/share').set(bearer(a.token)).send({ durationMin: 60 }).expect(200);
    expect(new Date(s.body.sharing.until).getTime()).toBeGreaterThan(Date.now() + 59 * 60_000);
    await ctx.http.post('/v1/location').set(bearer(a.token)).send({ lat: 52.37, lng: 4.89, accuracyM: 20 }).expect(200);
    const me = (await ctx.http.get('/v1/map').set(bearer(a.token))).body.me;
    expect(me).not.toBeNull();
  });

  it('map tiles are public but only for valid tile coordinates', async () => {
    await ctx.http.get('/v1/tiles/30/1/1.png').expect(404);
    await ctx.http.get('/v1/tiles/2/4/0.png').expect(404);
    await ctx.http.get('/v1/tiles/a/0/0.png').expect(404);
  });
});
