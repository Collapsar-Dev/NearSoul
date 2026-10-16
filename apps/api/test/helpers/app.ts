import sharp from 'sharp';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { PrismaService } from '../../src/common/prisma.service';
import { RateLimiter } from '../../src/common/rate-limit';
import { resetEnvCache } from '../../src/config/env';
import { QUICK_SCAN_ITEMS } from '../../src/engine';
import { AiProvider, FakeAiProvider } from '../../src/modules/ai/ai.provider';
import { EmailService } from '../../src/modules/auth/email.service';

export interface TestCtx {
  app: INestApplication;
  http: ReturnType<typeof request>;
  prisma: PrismaService;
  email: EmailService;
  ai: FakeAiProvider;
  limiter: RateLimiter;
}

export async function createTestApp(envOverrides: Record<string, string> = {}): Promise<TestCtx> {
  Object.assign(process.env, envOverrides);
  resetEnvCache();
  const ai = new FakeAiProvider();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(AiProvider).useValue(ai).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return {
    app,
    http: request(app.getHttpServer()),
    prisma: app.get(PrismaService),
    email: app.get(EmailService),
    ai,
    limiter: app.get(RateLimiter),
  };
}

const TABLES = [
  'messages', 'reports', 'matches', 'likes', 'blocks', 'reports_moderation', 'moderation_actions', 'audit_events',
  'notifications', 'invite_redemptions', 'invites', 'feedback', 'ratings', 'user_locations', 'nearby_sessions',
  'nearby_alerts', 'nearby_later', 'pair_outcomes', 'daily_sets', 'personality_cards', 'layer_overrides',
  'soul_profiles', 'engine_answers', 'photos', 'profile_interests', 'profiles', 'consents', 'device_tokens',
  'sessions', 'auth_codes', 'soul_messages', 'soul_insights', 'soul_sessions', 'user_data_keys', 'safety_events', 'users', 'admin_users', 'match_config', 'media',
];

export async function resetDb(ctx: TestCtx): Promise<void> {
  await ctx.prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
  ctx.limiter.reset();
  ctx.email.outbox.clear();
  ctx.ai.next = null;
  ctx.ai.calls = [];
  ctx.ai.replies = [];
  ctx.ai.converseCalls = [];
}

export function lastCode(ctx: TestCtx, email: string): string {
  const mail = ctx.email.outbox.get(email.trim().toLowerCase());
  const m = mail?.text.match(/\b(\d{6})\b/);
  if (!m) throw new Error(`No code for ${email}`);
  return m[1] as string;
}

/** Signs up (or in) through the real email-code flow; returns an access token. */
export async function signIn(ctx: TestCtx, email: string, extra: Record<string, unknown> = {}): Promise<{ token: string; refreshToken: string; userId: string }> {
  await ctx.http.post('/v1/auth/code').send({ email }).expect(202);
  const res = await ctx.http.post('/v1/auth/verify').send({ email, code: lastCode(ctx, email), ...extra }).expect(200);
  return { token: res.body.accessToken, refreshToken: res.body.refreshToken, userId: res.body.user.id };
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

/** Varied answers that complete the Quick Scan. */
export function quickScanAnswers(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let i = 0;
  for (const item of QUICK_SCAN_ITEMS) {
    if (item.optional) continue;
    if (item.type === 'likert5') out[item.key] = [2, 4, 3, 5, 1][i++ % 5];
    else if (item.type === 'single') out[item.key] = item.options![0]!.key;
    else out[item.key] = item.options!.slice(0, item.minSelect ?? 1).map((o) => o.key);
  }
  return { ...out, ...overrides };
}

/** Age gate + consents + full Quick Scan. */
export async function passGateAndScan(ctx: TestCtx, token: string, answers = quickScanAnswers(), opts: { aiConsent?: boolean } = {}) {
  await ctx.http.post('/v1/me/dob').set(bearer(token)).send({ dob: '1995-05-05' }).expect(200);
  await ctx.http.post('/v1/me/consents').set(bearer(token)).send({ terms: true, optional: { ai_writing: !!opts.aiConsent } }).expect(200);
  for (const [k, v] of Object.entries(answers)) {
    await ctx.http.put(`/v1/engine/answers/${k}`).set(bearer(token)).send({ value: v }).expect(200);
  }
}


/** A 600×600 JPEG carrying EXIF GPS data (to prove we strip it). */
export async function testJpeg(seed = 0): Promise<Buffer> {
  return sharp({ create: { width: 600, height: 600, channels: 3, background: { r: (seed * 40) % 255, g: 120, b: 200 } } })
    .jpeg()
    .withExif({ IFD0: { Artist: 'Test Person' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '52/1 22/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '4/1 54/1 0/1' } })
    .toBuffer();
}

export interface OnboardOpts {
  gender?: 'woman' | 'man' | 'non_binary';
  interestedIn?: ('woman' | 'man' | 'non_binary')[];
  intent?: 'long_term' | 'open_to_long' | 'casual' | 'not_sure';
  answers?: Record<string, unknown>;
  dob?: string;
  shareLevel?: 'minimal' | 'standard' | 'deep';
  interests?: string[];
  firstName?: string;
  discovery?: boolean;
}

/** Full onboarding through the public API → an active, discoverable user. */
export async function onboard(ctx: TestCtx, email: string, o: OnboardOpts = {}) {
  const { token, userId } = await signIn(ctx, email);
  await ctx.http.post('/v1/me/dob').set(bearer(token)).send({ dob: o.dob ?? '1995-05-05' }).expect(200);
  await ctx.http.post('/v1/me/consents').set(bearer(token)).send({ terms: true }).expect(200);
  for (const [k, v] of Object.entries(o.answers ?? quickScanAnswers())) {
    await ctx.http.put(`/v1/engine/answers/${k}`).set(bearer(token)).send({ value: v }).expect(200);
  }
  await ctx.http.post('/v1/me/card/generate').set(bearer(token)).send({}).expect(201);
  await ctx.http.patch('/v1/me/card').set(bearer(token)).send({ reviewed: true }).expect(200);
  await ctx.http.patch('/v1/me/share-level').set(bearer(token)).send({ level: o.shareLevel ?? 'standard' }).expect(204);
  await ctx.http.put('/v1/me/profile').set(bearer(token)).send({
    firstName: o.firstName ?? (email.split('@')[0]!.replace(/[^a-z]/gi, '').slice(0, 20) || 'Tester'),
    gender: o.gender ?? 'woman',
    interestedIn: o.interestedIn ?? ['man'],
    intent: o.intent ?? 'long_term',
    cityId: 'amsterdam',
    interests: o.interests ?? ['hiking', 'coffee', 'books'],
    ageMin: 18,
    ageMax: 60,
  }).expect(200);
  for (let i = 0; i < 2; i++) await ctx.http.post('/v1/photos').set(bearer(token)).attach('photo', await testJpeg(i), 'p.jpg').expect(201);
  await ctx.http.post('/v1/me/onboarding/complete').set(bearer(token)).expect(200);
  if (o.discovery !== false) await ctx.http.patch('/v1/me').set(bearer(token)).send({ discoveryEnabled: true }).expect(200);
  return { token, userId };
}
