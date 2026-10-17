import { loadEnv } from './env';

const base = { DATABASE_URL: 'postgresql://x:y@localhost:5432/db', JWT_SECRET: 'x'.repeat(40) };
const alpha = { ...base, APP_ENV: 'alpha', EMAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'k', STORAGE_DRIVER: 'db' };

describe('environment guards', () => {
  it('forbids dev-only drivers outside development/test', () => {
    expect(() => loadEnv({ ...base, APP_ENV: 'alpha' })).toThrow(/EMAIL_PROVIDER=console/);
    expect(() => loadEnv({ ...alpha, STORAGE_DRIVER: 'local' })).toThrow(/STORAGE_DRIVER=local/);
    expect(loadEnv(alpha).APP_ENV).toBe('alpha');
  });

  it('on-screen codes are allowed for the alpha but never in staging/production', () => {
    expect(loadEnv({ ...base, APP_ENV: 'alpha', EMAIL_PROVIDER: 'screen', STORAGE_DRIVER: 'db' }).EMAIL_PROVIDER).toBe('screen');
    for (const APP_ENV of ['staging', 'production']) {
      expect(() => loadEnv({ ...base, APP_ENV, EMAIL_PROVIDER: 'screen', STORAGE_DRIVER: 'db' })).toThrow(/EMAIL_PROVIDER=screen/);
    }
  });

  it('Soul Talk needs a master key and approved crisis texts outside development/test (SOUL-006/007)', () => {
    expect(() => loadEnv({ ...alpha, SOUL_TALK_ENABLED: 'true' })).toThrow(/SOUL_MASTER_KEY/);
    const key = Buffer.alloc(32, 7).toString('base64');
    expect(() => loadEnv({ ...alpha, SOUL_TALK_ENABLED: 'true', SOUL_MASTER_KEY: key })).toThrow(/CRISIS/);
    const ok = loadEnv({ ...alpha, SOUL_TALK_ENABLED: 'true', SOUL_MASTER_KEY: key, CRISIS_RESOURCES: '{"default":[{"name":"Emergency","phone":"112"}]}', CRISIS_TEXTS_APPROVED: 'true' });
    expect(ok.SOUL_TALK_ENABLED).toBe(true);
  });

  it('requires provider keys for real email and AI', () => {
    expect(() => loadEnv({ ...alpha, BREVO_API_KEY: undefined })).toThrow(/BREVO_API_KEY/);
    expect(() => loadEnv({ ...alpha, AI_ENABLED: 'true' })).toThrow(/ANTHROPIC_API_KEY/);
  });
});
