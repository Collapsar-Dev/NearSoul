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
  'sessions', 'auth_codes', 'users', 'admin_users', 'match_config',
];

export async function resetDb(ctx: TestCtx): Promise<void> {
  await ctx.prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
  ctx.limiter.reset();
  ctx.email.outbox.clear();
  ctx.ai.next = null;
  ctx.ai.calls = [];
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
