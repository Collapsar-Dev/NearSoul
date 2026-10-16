import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const EnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'alpha', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  APP_ORIGINS: z.string().default('http://localhost:8080'),
  COOKIE_DOMAIN: z.string().optional(),
  INVITE_ONLY: bool.default('false'),
  EMAIL_PROVIDER: z.enum(['console', 'resend', 'brevo']).default('console'),
  BREVO_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('NearSoul <hello@nearsoul.app>'),
  AI_ENABLED: bool.default('false'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_WRITER: z.string().default('claude-haiku-4-5-20251001'),
  AI_DAILY_BUDGET_USD: z.coerce.number().default(10),
  STORAGE_DRIVER: z.enum(['local', 's3', 'db']).default('local'),
  WEB_DIST_DIR: z.string().optional(),
  LOCAL_STORAGE_DIR: z.string().default('.data/storage'),
  PUBLIC_API_URL: z.string().default('http://localhost:3000'),
  APP_PUBLIC_URL: z.string().default('http://localhost:8080'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  PAYWALL_ENABLED: bool.default('false'),
  LAUNCH_CITY: z.string().default('amsterdam'),
  DAILY_SET_SIZE: z.coerce.number().int().min(1).max(50).default(15),
  TERMS_VERSION: z.string().default('2026-10-alpha'),
  SOUL_TALK_ENABLED: bool.default('false'),
  /** base64 of 32 random bytes; wraps per-user data keys (SOUL-007). Required when Soul Talk is enabled outside dev/test. */
  SOUL_MASTER_KEY: z.string().optional(),
  SOUL_MODEL: z.string().default('claude-sonnet-5-5'),
  SOUL_SAFETY_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  SOUL_TRANSCRIPT_TTL_DAYS: z.coerce.number().int().min(1).default(90),
  /** JSON: { "NL": [{ "name": "113 Zelfmoordpreventie", "phone": "0800-0113", "url": "https://www.113.nl" }], "default": [...] } */
  CRISIS_RESOURCES: z.string().optional(),
  CRISIS_TEXTS_APPROVED: bool.default('false'),
  /** First admin for hosts without a shell (free Render): created once on boot if no admin exists. */
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default('https://eu.i.posthog.com'),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  const env = parsed.data;
  if (env.APP_ENV === 'production' || env.APP_ENV === 'staging' || env.APP_ENV === 'alpha') {
    if (env.EMAIL_PROVIDER === 'console') throw new Error('EMAIL_PROVIDER=console is not allowed outside development/test');
    if (env.STORAGE_DRIVER === 'local') throw new Error('STORAGE_DRIVER=local is not allowed outside development/test');
  }
  if (env.EMAIL_PROVIDER === 'brevo' && !env.BREVO_API_KEY) throw new Error('EMAIL_PROVIDER=brevo requires BREVO_API_KEY');
  if (env.EMAIL_PROVIDER === 'resend' && !env.RESEND_API_KEY) throw new Error('EMAIL_PROVIDER=resend requires RESEND_API_KEY');
  if (env.SOUL_TALK_ENABLED && !['development', 'test'].includes(env.APP_ENV)) {
    if (!env.SOUL_MASTER_KEY || Buffer.from(env.SOUL_MASTER_KEY, 'base64').length !== 32) throw new Error('SOUL_TALK_ENABLED requires SOUL_MASTER_KEY (base64, 32 bytes)');
    // SOUL-006: Soul Talk can't reach real users until the founder approved the crisis message and resources.
    if (!env.CRISIS_TEXTS_APPROVED || !env.CRISIS_RESOURCES) throw new Error('SOUL_TALK_ENABLED requires CRISIS_RESOURCES and CRISIS_TEXTS_APPROVED=true');
  }
  if (env.AI_ENABLED && !env.ANTHROPIC_API_KEY) throw new Error('AI_ENABLED requires ANTHROPIC_API_KEY');
  return env;
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

/** Test helper: reset the cached env after changing process.env. */
export function resetEnvCache(): void {
  cached = null;
}

export const isAlpha = () => env().APP_ENV === 'alpha';
export const isDevOrTest = () => env().APP_ENV === 'development' || env().APP_ENV === 'test';
