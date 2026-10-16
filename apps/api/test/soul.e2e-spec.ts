import { randomUUID } from 'node:crypto';
import { RetentionService } from '../src/modules/jobs/retention.service';
import { splitChips } from '../src/modules/soul/soul.service';
import { bearer, createTestApp, lastCode, onboard, resetDb, type TestCtx } from './helpers/app';

const WRAPUP = {
  summary: 'You described needing calm time before hard talks, and loving long walks.',
  insights: [
    { text: 'I need time to cool down before talking', category: 'need', evidence: 'You said you go quiet first, then talk.', trait_suggestion: { trait_key: 'conflict_style', value: 'cool_down_then_talk' } },
    { text: 'Long walks recharge me', category: 'preference', evidence: 'You mentioned walks by the water.', trait_suggestion: { trait_key: 'smoking', value: 'never' } },
  ],
  question_to_sit_with: 'What helps you feel ready to talk again?',
};

describe('Soul Talk (SOUL-001..008)', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ SOUL_TALK_ENABLED: 'true' });
  });
  afterAll(async () => {
    process.env.SOUL_TALK_ENABLED = 'false';
    await ctx.app.close();
  });
  beforeEach(async () => resetDb(ctx));

  async function user(email = 'anna@example.com') {
    const u = await onboard(ctx, email);
    await ctx.http.post('/v1/me/consents').set(bearer(u.token)).send({ optional: { ai_self_discovery: true } }).expect(200);
    return u;
  }
  const send = (token: string, sessionId: string, text: string, key = randomUUID()) =>
    ctx.http.post(`/v1/soul/sessions/${sessionId}/messages`).set(bearer(token)).set('idempotency-key', key).send({ text });

  it('requires the separate AI Self-Discovery consent', async () => {
    const u = await onboard(ctx, 'noconsent@example.com');
    const r = await ctx.http.get('/v1/soul/topics').set(bearer(u.token));
    expect(r.body.error.code).toBe('SOUL_CONSENT_REQUIRED');
  });

  it('lists 8 topics, starts with a prewritten opening and stores everything encrypted', async () => {
    const u = await user();
    const topics = await ctx.http.get('/v1/soul/topics').set(bearer(u.token)).expect(200);
    expect(topics.body.topics).toHaveLength(8);
    expect(topics.body.suggested).toBeDefined();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'communication' }).expect(201);
    expect(s.body.messages).toHaveLength(1);
    expect(s.body.messages[0].role).toBe('guide');
    expect(ctx.ai.converseCalls).toHaveLength(0);
    ctx.ai.replies.push('It sounds like you value calm. What helps you feel heard?\nCHIPS: ["Being listened to","Time"]');
    const r = await send(u.token, s.body.id, 'I usually go quiet first and talk later about the secret lake trip').expect(200);
    expect(r.body.reply.text).toBe('It sounds like you value calm. What helps you feel heard?');
    expect(r.body.chips).toEqual(['Being listened to', 'Time']);
    const rows = await ctx.prisma.soulMessage.findMany();
    expect(rows.every((m) => m.bodyEnc.startsWith('v1.'))).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('secret lake');
    // The guide only receives this conversation, never email or profile data.
    expect(JSON.stringify(ctx.ai.converseCalls)).not.toContain('anna@example.com');
  });

  it('retries with the same idempotency key do not duplicate messages', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'energy' }).expect(201);
    ctx.ai.replies.push('Reply one?');
    const key = randomUUID();
    await send(u.token, s.body.id, 'Hello', key).expect(200);
    const again = await send(u.token, s.body.id, 'Hello', key).expect(200);
    expect(again.body.reply.text).toBe('Reply one?');
    expect(await ctx.prisma.soulMessage.count()).toBe(3);
  });

  it('keeps the user message and asks for a retry when the AI is unavailable', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'energy' }).expect(201);
    const key = randomUUID();
    const r = await send(u.token, s.body.id, 'Hello there', key);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe('SOUL_RETRY');
    ctx.ai.replies.push('Now I am here?');
    expect((await send(u.token, s.body.id, 'Hello there', key).expect(200)).body.reply.text).toBe('Now I am here?');
    expect(await ctx.prisma.soulMessage.count({ where: { role: 'user' } })).toBe(1);
  });

  it('crisis messages get the fixed supportive message, no AI reply, and a content-free safety event', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'past_lessons' }).expect(201);
    ctx.ai.replies.push('should never be used');
    const r = await send(u.token, s.body.id, 'Honestly some days I want to die').expect(200);
    expect(r.body.safety.category).toBe('support');
    expect(r.body.safety.resources.length).toBeGreaterThan(0);
    expect(ctx.ai.converseCalls).toHaveLength(0);
    const ev = await ctx.prisma.safetyEvent.findMany();
    expect(ev).toHaveLength(1);
    expect(Object.keys(ev[0]!).sort()).toEqual(['category', 'createdAt', 'id', 'userId']);
    expect((await ctx.prisma.soulSession.findUniqueOrThrow({ where: { id: s.body.id } })).status).toBe('paused_safety');
    expect((await send(u.token, s.body.id, 'ok')).body.error.code).toBe('SESSION_CLOSED');
    await ctx.http.post(`/v1/soul/sessions/${s.body.id}/continue`).set(bearer(u.token)).expect(204);
  });

  it('a user who says they are under 18 ends the session and is flagged for age review', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'energy' }).expect(201);
    const r = await send(u.token, s.body.id, 'Well, I am 16 years old actually').expect(200);
    expect(r.body.safety.category).toBe('underage');
    expect(await ctx.prisma.auditEvent.count({ where: { action: 'age_review_flag', targetId: u.userId } })).toBe(1);
  });

  it('wrap-up proposes insights; only kept "matching" insights change traits, and it is reversible', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'communication' }).expect(201);
    ctx.ai.replies.push('Tell me more?', 'And then?');
    await send(u.token, s.body.id, 'I go quiet first').expect(200);
    await send(u.token, s.body.id, 'Then I talk it through').expect(200);
    ctx.ai.next = WRAPUP;
    const w = await ctx.http.post(`/v1/soul/sessions/${s.body.id}/finish`).set(bearer(u.token)).expect(200);
    expect(w.body.insights).toHaveLength(2);
    expect(w.body.questionToSitWith).toBe(WRAPUP.question_to_sit_with);
    const [conflict, walks] = w.body.insights;
    expect(conflict.affectsMatching).toBe(true);
    expect(walks.affectsMatching).toBe(false); // smoking isn't allowed for this topic → dropped
    // Nothing applied before Keep
    let prof = await ctx.http.get('/v1/me/soul-profile').set(bearer(u.token)).expect(200);
    expect(prof.body.profile.relationship.conflict_style.source).toBe('quick_scan');
    await ctx.http.patch(`/v1/soul/insights/${conflict.id}`).set(bearer(u.token)).send({ status: 'kept', visibility: 'matching' }).expect(200);
    prof = await ctx.http.get('/v1/me/soul-profile').set(bearer(u.token)).expect(200);
    expect(prof.body.profile.relationship.conflict_style).toEqual({ value: 'cool_down_then_talk', source: 'soul_talk' });
    await ctx.http.patch(`/v1/soul/insights/${conflict.id}`).set(bearer(u.token)).send({ visibility: 'private' }).expect(200);
    prof = await ctx.http.get('/v1/me/soul-profile').set(bearer(u.token)).expect(200);
    expect(prof.body.profile.relationship.conflict_style.source).toBe('quick_scan');
    const map = await ctx.http.get('/v1/me/soul-map').set(bearer(u.token)).expect(200);
    expect(map.body.count).toBe(1);
    await ctx.http.patch(`/v1/soul/insights/${walks.id}`).set(bearer(u.token)).send({ status: 'discarded' }).expect(200);
    expect(await ctx.prisma.soulInsight.count()).toBe(1);
  });

  it('short sessions finish without insights', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'values' }).expect(201);
    const w = await ctx.http.post(`/v1/soul/sessions/${s.body.id}/finish`).set(bearer(u.token)).expect(200);
    expect(w.body.tooShort).toBe(true);
    expect(w.body.insights).toEqual([]);
  });

  it('is owner-only', async () => {
    const a = await user('anna@example.com');
    const b = await user('bella@example.com');
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(a.token)).send({ topicKey: 'values' }).expect(201);
    await ctx.http.get(`/v1/soul/sessions/${s.body.id}`).set(bearer(b.token)).expect(404);
    await send(b.token, s.body.id, 'hi').expect(404);
    await ctx.http.delete(`/v1/soul/sessions/${s.body.id}`).set(bearer(b.token)).expect(404);
  });

  it('purges transcripts after the retention period but keeps summaries and insights', async () => {
    const u = await user();
    const s = await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'communication' }).expect(201);
    ctx.ai.replies.push('Hm?', 'And?');
    await send(u.token, s.body.id, 'one').expect(200);
    await send(u.token, s.body.id, 'two').expect(200);
    ctx.ai.next = WRAPUP;
    await ctx.http.post(`/v1/soul/sessions/${s.body.id}/finish`).set(bearer(u.token)).expect(200);
    expect((await ctx.prisma.soulMessage.findFirstOrThrow()).purgeAt).not.toBeNull();
    await ctx.app.get(RetentionService).purge(new Date(Date.now() + 91 * 86_400_000));
    expect(await ctx.prisma.soulMessage.count()).toBe(0);
    const again = await ctx.http.get(`/v1/soul/sessions/${s.body.id}`).set(bearer(u.token)).expect(200);
    expect(again.body.summary).toBe(WRAPUP.summary);
  });

  it('account deletion crypto-shreds the user data key first', async () => {
    const u = await user();
    await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'values' }).expect(201);
    expect(await ctx.prisma.userDataKey.count({ where: { userId: u.userId } })).toBe(1);
    await ctx.http.post('/v1/me/sensitive-code').set(bearer(u.token)).expect(202);
    await ctx.http.post('/v1/me/delete').set(bearer(u.token)).send({ code: lastCode(ctx, 'anna@example.com') }).expect(202);
    expect(await ctx.prisma.userDataKey.count({ where: { userId: u.userId } })).toBe(0);
  });

  it('parses the CHIPS line safely', () => {
    expect(splitChips('Hello?')).toEqual({ reply: 'Hello?', chips: [] });
    expect(splitChips('Hi?\nCHIPS: not json')).toEqual({ reply: 'Hi?\nCHIPS: not json', chips: [] });
    expect(splitChips('Q?\nCHIPS: ["a","b","c","d"]').chips).toEqual(['a', 'b', 'c']);
  });
});

describe('Soul Talk flag off', () => {
  let ctx: TestCtx;
  beforeAll(async () => {
    ctx = await createTestApp({ SOUL_TALK_ENABLED: 'false' });
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('returns 404 for every Soul Talk route', async () => {
    const u = await onboard(ctx, 'anna@example.com');
    await ctx.http.get('/v1/soul/topics').set(bearer(u.token)).expect(404);
    await ctx.http.post('/v1/soul/sessions').set(bearer(u.token)).send({ topicKey: 'values' }).expect(404);
  });
});
