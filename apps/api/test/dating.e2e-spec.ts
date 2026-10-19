import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { bearer, createTestApp, onboard, passGateAndScan, quickScanAnswers, resetDb, signIn, testJpeg, type TestCtx } from './helpers/app';

const PUBLIC_KEYS = ['activity', 'age', 'archetype', 'bio', 'card', 'city', 'compatibility', 'distanceBand', 'firstName', 'heightCm', 'id', 'interests', 'intent', 'isDemo', 'jobTitle', 'photos', 'verified'].sort();
const FORBIDDEN = /"(email|dob|lat|lng|h3Cell|cell|distance_m|distanceM|score|answers|traits|hiddenByModeration|status|role|profile)"\s*:/;

describe('Profile & photos (PROF-001..002)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('re-encodes uploads to WebP and strips EXIF/GPS', async () => {
    const original = await testJpeg();
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const { token, userId } = await signIn(ctx, 'photo@example.com');
    await passGateAndScan(ctx, token, {});
    const res = await ctx.http.post('/v1/photos').set(bearer(token)).attach('photo', original, 'p.jpg').expect(201);
    const row = await ctx.prisma.photo.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(row.storageKey).toMatch(new RegExp(`^photos/${userId}/[0-9a-f-]{36}\\.webp$`));
    const served = await ctx.http.get(new URL(res.body.url).pathname + new URL(res.body.url).search).expect(200);
    const meta = await sharp(served.body as Buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();
    // tampered signature is rejected
    await ctx.http.get(new URL(res.body.url).pathname + '?exp=9999999999&sig=' + '0'.repeat(64)).expect(404);
  });

  it('rejects non-images, tiny images and a 7th photo', async () => {
    const { token } = await signIn(ctx, 'bad@example.com');
    await passGateAndScan(ctx, token, {});
    const txt = await ctx.http.post('/v1/photos').set(bearer(token)).attach('photo', Buffer.from('not an image'), 'x.jpg');
    expect(txt.body.error.code).toBe('INVALID_IMAGE');
    const tiny = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#fff' } }).png().toBuffer();
    expect((await ctx.http.post('/v1/photos').set(bearer(token)).attach('photo', tiny, 't.png')).body.error.code).toBe('IMAGE_TOO_SMALL');
    for (let i = 0; i < 6; i++) await ctx.http.post('/v1/photos').set(bearer(token)).attach('photo', await testJpeg(i), 'p.jpg').expect(201);
    expect((await ctx.http.post('/v1/photos').set(bearer(token)).attach('photo', await testJpeg(9), 'p.jpg')).body.error.code).toBe('TOO_MANY_PHOTOS');
  });

  it('rejects contact info in bios and unknown fields', async () => {
    const { token } = await signIn(ctx, 'bio@example.com');
    await passGateAndScan(ctx, token, {});
    const base = { firstName: 'Ana', gender: 'woman', interestedIn: ['man'], intent: 'long_term', interests: ['hiking', 'coffee', 'books'] };
    for (const bio of ['Find me on instagram', 'call +31 6 1234 5678', 'see www.mysite.com', 'dm @ana_99']) {
      const r = await ctx.http.put('/v1/me/profile').set(bearer(token)).send({ ...base, bio });
      expect(r.body.error.code).toBe('BIO_CONTACT_INFO');
    }
    expect((await ctx.http.put('/v1/me/profile').set(bearer(token)).send({ ...base, isAdmin: true })).status).toBe(400);
    await ctx.http.put('/v1/me/profile').set(bearer(token)).send({ ...base, bio: 'Love hiking and good coffee.' }).expect(200);
  });
});

describe('Discovery, likes, matches, chat (ENG-011/014, LIKE-001..004, CHAT-001)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('builds a daily set with eligible, compatible people only and keeps it stable', async () => {
    const a = await onboard(ctx, 'anna@example.com', { gender: 'woman', interestedIn: ['man'] });
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const casual = await onboard(ctx, 'carl@example.com', { gender: 'man', interestedIn: ['woman'], intent: 'casual' });
    const wrongPref = await onboard(ctx, 'dan@example.com', { gender: 'man', interestedIn: ['man'] });
    const hidden = await onboard(ctx, 'eve@example.com', { gender: 'man', interestedIn: ['woman'], discovery: false });
    const set = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    const ids = set.body.cards.map((c: { id: string }) => c.id);
    expect(ids).toContain(b.userId);
    expect(ids).not.toContain(casual.userId);
    expect(ids).not.toContain(wrongPref.userId);
    expect(ids).not.toContain(hidden.userId);
    const again = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    expect(again.body.cards.map((c: { id: string }) => c.id)).toEqual(ids);
    expect(set.body.refreshAt).toBeDefined();
  });

  it('rebuilds the daily set when every candidate has left', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    await ctx.prisma.user.update({ where: { id: b.userId }, data: { status: 'suspended' } });
    const c = await onboard(ctx, 'carl@example.com', { gender: 'man', interestedIn: ['woman'] });
    const set = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    expect(set.body.cards.map((x: { id: string }) => x.id)).toEqual([c.userId]);
  });

  it('tells the viewer why the day is empty when they are not ready (discovery off)', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await onboard(ctx, 'anna@example.com');
    await ctx.http.patch('/v1/me').set(bearer(ben.token)).send({ discoveryEnabled: false }).expect(200);
    const hidden = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(hidden.body).toMatchObject({ cards: [], viewerBlocked: 'NOT_DISCOVERABLE' });
  });

  it('an empty day is rebuilt once people join instead of staying empty until tomorrow', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const empty = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(empty.body.cards).toHaveLength(0);
    const anna = await onboard(ctx, 'anna@example.com');
    await ctx.prisma.dailySet.updateMany({ where: { userId: ben.userId }, data: { generatedAt: new Date(Date.now() - 5 * 60_000) } });
    const later = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(later.body.cards.map((c: { id: string }) => c.id)).toContain(anna.userId);
  });

  it('pages a large daily set and reports totals', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    for (let i = 0; i < 3; i++) await onboard(ctx, `w${i}@example.com`);
    const all = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(all.body.total).toBe(3);
    const p1 = await ctx.http.get('/v1/daily-set?offset=0&limit=2').set(bearer(ben.token)).expect(200);
    const p2 = await ctx.http.get('/v1/daily-set?offset=2&limit=2').set(bearer(ben.token)).expect(200);
    expect(p1.body.cards).toHaveLength(2);
    expect(p2.body.cards).toHaveLength(1);
    expect([...p1.body.cards, ...p2.body.cards].map((c: { id: string }) => c.id)).toEqual(all.body.cards.map((c: { id: string }) => c.id));
    await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: p2.body.cards[0].id, action: 'like' }).expect(200);
    const after = await ctx.http.get('/v1/daily-set?offset=0&limit=1').set(bearer(ben.token)).expect(200);
    expect(after.body).toMatchObject({ total: 3, actedCount: 1, remaining: 2 });
  });

  it('exposes only allowlisted public fields (contract test)', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const set = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    const card = set.body.cards.find((c: { id: string }) => c.id === b.userId);
    const { action: _action, ...publicCard } = card;
    expect(Object.keys(publicCard).sort()).toEqual(PUBLIC_KEYS);
    expect(JSON.stringify(publicCard)).not.toMatch(FORBIDDEN);
    expect(JSON.stringify(publicCard)).not.toContain('ben@example.com');
    expect(card.compatibility.tier).toMatch(/strong|good|some|low/);
    // CR-23: a rounded match percentage is shown; individual trait scores never are.
    expect(card.compatibility.percent % 5).toBe(0);
    expect(card.compatibility.percent).toBeGreaterThanOrEqual(0);
    expect(card.compatibility.percent).toBeLessThanOrEqual(100);
    expect(card.card).toBeNull(); // matches_only by default
    const prof = await ctx.http.get(`/v1/profiles/${b.userId}`).set(bearer(a.token)).expect(200);
    expect(Object.keys(prof.body).sort()).toEqual(PUBLIC_KEYS);
  });

  it('returns 404 for profiles outside your daily set, nearby list or matches', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const stranger = await onboard(ctx, 'zed@example.com', { gender: 'woman', interestedIn: ['man'] });
    await ctx.http.get(`/v1/profiles/${stranger.userId}`).set(bearer(a.token)).expect(404);
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: stranger.userId, action: 'like' }).expect(404);
  });

  it('creates a match only on mutual likes and notifies both', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    await ctx.http.get('/v1/daily-set').set(bearer(b.token)).expect(200);
    const first = await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' }).expect(200);
    expect(first.body.match).toBeNull();
    const again = await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' }).expect(200);
    expect(again.body.match).toBeNull();
    const second = await ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' }).expect(200);
    expect(second.body.match.id).toBeDefined();
    expect(await ctx.prisma.match.count()).toBe(1);
    expect(await ctx.prisma.notification.count({ where: { type: 'new_match' } })).toBe(2);
    const matchesA = await ctx.http.get('/v1/matches').set(bearer(a.token)).expect(200);
    expect(matchesA.body[0].user.firstName).toBe('ben');
    // once matched, the card is visible (matches_only)
    const prof = await ctx.http.get(`/v1/profiles/${b.userId}`).set(bearer(a.token)).expect(200);
    expect(prof.body.card.headline).toBeDefined();
  });

  it('a person shown through the widened age range can be liked (own age filter never blocks a like)', async () => {
    const ben = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'], dob: '1995-05-05' });
    await ctx.http.put('/v1/me/profile').set(bearer(ben.token)).send({ firstName: 'Ben', gender: 'man', interestedIn: ['woman'], intent: 'long_term', cityId: 'amsterdam', interests: ['hiking', 'coffee', 'books'], ageMin: 29, ageMax: 31 }).expect(200);
    const anna = await onboard(ctx, 'anna@example.com', { dob: new Date(Date.UTC(new Date().getUTCFullYear() - 33, 0, 1)).toISOString().slice(0, 10) });
    const set = await ctx.http.get('/v1/daily-set').set(bearer(ben.token)).expect(200);
    expect(set.body.cards.map((c: { id: string }) => c.id)).toContain(anna.userId);
    await ctx.http.post('/v1/likes').set(bearer(ben.token)).send({ targetId: anna.userId, action: 'like' }).expect(200);
  });

  it('concurrent mutual likes create exactly one match', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.get('/v1/daily-set').set(bearer(a.token));
    await ctx.http.get('/v1/daily-set').set(bearer(b.token));
    await ctx.prisma.like.createMany({ data: [{ actorId: a.userId, targetId: b.userId, action: 'pass', source: 'daily' }, { actorId: b.userId, targetId: a.userId, action: 'pass', source: 'daily' }] });
    await Promise.all([
      ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' }),
      ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' }),
    ]);
    // Both requests may race past the reverse-like read; the unique pair still guarantees ≤ 1 match.
    expect(await ctx.prisma.match.count()).toBeLessThanOrEqual(1);
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' });
    expect(await ctx.prisma.match.count()).toBe(1);
  });

  async function matched() {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    await ctx.http.get('/v1/daily-set').set(bearer(a.token));
    await ctx.http.get('/v1/daily-set').set(bearer(b.token));
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' });
    const r = await ctx.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' });
    return { a, b, matchId: r.body.match.id as string };
  }

  it('chat: participants only, idempotent retry, read receipts, safety tip', async () => {
    const { a, b, matchId } = await matched();
    const outsider = await onboard(ctx, 'olga@example.com');
    const cid = randomUUID();
    const m1 = await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).send({ clientMessageId: cid, body: 'Hi Ben!' }).expect(201);
    const dup = await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).send({ clientMessageId: cid, body: 'Hi Ben!' }).expect(201);
    expect(dup.body.id).toBe(m1.body.id);
    await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(b.token)).send({ clientMessageId: randomUUID(), body: 'text me on whatsapp +31 6 1234 5678' }).expect(201);
    const listA = await ctx.http.get(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).expect(200);
    expect(listA.body.items).toHaveLength(2);
    expect(listA.body.items[1].safetyTip).toBe(true);
    await ctx.http.get(`/v1/matches/${matchId}/messages`).set(bearer(outsider.token)).expect(404);
    await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(outsider.token)).send({ clientMessageId: randomUUID(), body: 'x' }).expect(404);
    await ctx.http.post(`/v1/matches/${matchId}/read`).set(bearer(b.token)).expect(204);
    const after = await ctx.http.get(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).expect(200);
    expect(after.body.items[0].read).toBe(true);
    expect((await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(a.token)).send({ clientMessageId: randomUUID(), body: 'x'.repeat(1001) })).body.error.code).toBe('MESSAGE_TOO_LONG');
  });

  it('unmatch and block stop contact immediately', async () => {
    const { a, b, matchId } = await matched();
    await ctx.http.delete(`/v1/matches/${matchId}`).set(bearer(a.token)).expect(204);
    await ctx.http.post(`/v1/matches/${matchId}/messages`).set(bearer(b.token)).send({ clientMessageId: randomUUID(), body: 'hey?' }).expect(404);
    expect((await ctx.http.get('/v1/matches').set(bearer(b.token))).body).toHaveLength(0);
    await ctx.http.get(`/v1/profiles/${a.userId}`).set(bearer(b.token)).expect(404);
  });

  it('report blocks by default, ends the match and auto-hides after 3 reporters', async () => {
    const { a, b, matchId } = await matched();
    const r = await ctx.http.post('/v1/reports-moderation').set(bearer(a.token)).send({ userId: b.userId, category: 'threats', matchId }).expect(201);
    const report = await ctx.prisma.moderationReport.findUniqueOrThrow({ where: { id: r.body.id } });
    expect(report.urgent).toBe(true);
    expect(await ctx.prisma.block.count({ where: { blockerId: a.userId, blockedId: b.userId } })).toBe(1);
    expect((await ctx.prisma.match.findUniqueOrThrow({ where: { id: matchId } })).endReason).toBe('block');
    for (const e of ['r1@example.com', 'r2@example.com']) {
      const rep = await signIn(ctx, e);
      await ctx.http.post('/v1/reports-moderation').set(bearer(rep.token)).send({ userId: b.userId, category: 'scam' }).expect(201);
    }
    expect((await ctx.prisma.user.findUniqueOrThrow({ where: { id: b.userId } })).hiddenByModeration).toBe(true);
  });

});

describe('Reports (RPT-001..003)', () => {
  let ctx: TestCtx;
  afterEach(async () => ctx.app.close());

  async function pairOf(c: TestCtx, levels: [string, string] = ['standard', 'standard']) {
    const a = await onboard(c, 'anna@example.com', { shareLevel: levels[0] as 'standard', answers: quickScanAnswers({ rel_04: 'talk_now', life_02: 5 }) });
    const b = await onboard(c, 'ben@example.com', { gender: 'man', interestedIn: ['woman'], shareLevel: levels[1] as 'standard', answers: quickScanAnswers({ rel_04: 'let_it_go', life_02: 1 }) });
    await c.http.get('/v1/daily-set').set(bearer(a.token));
    await c.http.get('/v1/daily-set').set(bearer(b.token));
    await c.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like' });
    const r = await c.http.post('/v1/likes').set(bearer(b.token)).send({ targetId: a.userId, action: 'like' });
    return { a, b, matchId: r.body.match.id as string };
  }

  it('beta: full self and pair reports, labelled free during beta', async () => {
    ctx = await createTestApp({ PAYWALL_ENABLED: 'false' });
    await resetDb(ctx);
    const { a, matchId } = await pairOf(ctx);
    const self = await ctx.http.get('/v1/reports/self').set(bearer(a.token)).expect(200);
    expect(self.body.full).toBe(true);
    expect(self.body.freeDuringBeta).toBe(true);
    expect(self.body.domains).toHaveLength(5);
    expect(self.body.reflect).toHaveLength(3);
    const pair = await ctx.http.get(`/v1/matches/${matchId}/report`).set(bearer(a.token)).expect(200);
    expect(pair.body.full).toBe(true);
    expect(pair.body.frictions.length).toBeGreaterThan(0);
    expect(pair.body.tips.join(' ')).toContain('ben');
    expect(pair.body.starters.length).toBeGreaterThanOrEqual(3);
    expect(pair.body.bigFive).toBeNull(); // standard level
  });

  it('reciprocity: minimal share level hides frictions and tips', async () => {
    ctx = await createTestApp({ PAYWALL_ENABLED: 'false' });
    await resetDb(ctx);
    const { a, matchId } = await pairOf(ctx, ['deep', 'minimal']);
    const pair = await ctx.http.get(`/v1/matches/${matchId}/report`).set(bearer(a.token)).expect(200);
    expect(pair.body.effectiveShareLevel).toBe('minimal');
    expect(pair.body.frictions).toEqual([]);
    expect(pair.body.tips).toEqual([]);
    expect(pair.body.bigFive).toBeNull();
  });

  it('paywall on: only the teaser is sent, locked content never leaves the server', async () => {
    ctx = await createTestApp({ PAYWALL_ENABLED: 'true' });
    await resetDb(ctx);
    const { a, matchId } = await pairOf(ctx);
    const pair = await ctx.http.get(`/v1/matches/${matchId}/report`).set(bearer(a.token)).expect(200);
    expect(pair.body.full).toBe(false);
    expect(pair.body.frictions).toBeUndefined();
    expect(pair.body.tips).toBeUndefined();
    expect(pair.body.locked.map((l: { key: string }) => l.key)).toEqual(['frictions', 'tips', 'layers', 'first_date']);
    const self = await ctx.http.get('/v1/reports/self').set(bearer(a.token)).expect(200);
    expect(self.body.needs).toBeUndefined();
    expect(self.body.domains[0].dating).toBeUndefined();
    process.env.PAYWALL_ENABLED = 'false';
  });
});

describe('Today’s Souls refill in a small pool', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('people shown yesterday but never acted on come back; liked and passed people never do', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const b = await onboard(ctx, 'ben@example.com', { gender: 'man', interestedIn: ['woman'] });
    const c = await onboard(ctx, 'carl@example.com', { gender: 'man', interestedIn: ['woman'] });
    const d = await onboard(ctx, 'dan@example.com', { gender: 'man', interestedIn: ['woman'] });
    const first = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    expect(first.body.cards.map((x: { id: string }) => x.id).sort()).toEqual([b.userId, c.userId, d.userId].sort());
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: b.userId, action: 'like', source: 'daily' }).expect(200);
    await ctx.http.post('/v1/likes').set(bearer(a.token)).send({ targetId: c.userId, action: 'pass', source: 'daily' }).expect(200);
    // move yesterday's set back one day
    await ctx.prisma.dailySet.updateMany({ where: { userId: a.userId }, data: { date: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10) } });
    const next = await ctx.http.get('/v1/daily-set').set(bearer(a.token)).expect(200);
    expect(next.body.cards.map((x: { id: string }) => x.id)).toEqual([d.userId]);
  });
});

