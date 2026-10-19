import { generateKeyPairSync, sign } from 'node:crypto';
import { SocialAuthService } from '../src/modules/auth/social-auth.service';
import { bearer, createTestApp, onboard, resetDb, type TestCtx } from './helpers/app';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

function idToken(claims: Record<string, unknown>, key = privateKey) {
  const head = b64({ alg: 'RS256', kid: 'k1', typ: 'JWT' });
  const body = b64({ exp: Math.floor(Date.now() / 1000) + 600, iat: Math.floor(Date.now() / 1000), ...claims });
  return `${head}.${body}.${sign('RSA-SHA256', Buffer.from(`${head}.${body}`), key).toString('base64url')}`;
}

describe('Social sign-in: Google, Apple, VK ID (CR-33)', () => {
  let ctx: TestCtx;
  let social: SocialAuthService;
  beforeAll(async () => {
    ctx = await createTestApp({ GOOGLE_CLIENT_IDS: 'web.apps.googleusercontent.com,android.apps', APPLE_CLIENT_IDS: 'app.nearsoul.web', VK_CLIENT_ID: '54321' });
    social = ctx.app.get(SocialAuthService);
    social.fetchJson = async (url: string, init?: RequestInit) => {
      if (url.includes('googleapis.com') || url.includes('appleid.apple.com')) return { keys: [jwk] };
      if (url.endsWith('/oauth2/auth')) {
        const p = new URLSearchParams(String(init?.body));
        if (p.get('code') !== 'good-code' || p.get('code_verifier') !== 'v'.repeat(43)) throw new Error('bad');
        return { access_token: 'vk-at', user_id: 777 };
      }
      if (url.endsWith('/oauth2/user_info')) return { user: { user_id: '777', email: 'vk.person@example.com', first_name: 'Ani' } };
      throw new Error(`unexpected ${url}`);
    };
  });
  afterAll(async () => ctx.app.close());
  beforeEach(async () => resetDb(ctx));

  it('lists only configured providers with public client ids', async () => {
    const r = await ctx.http.get('/v1/auth/providers').expect(200);
    expect(r.body).toEqual({ google: { clientId: 'web.apps.googleusercontent.com' }, apple: { clientId: 'app.nearsoul.web' }, vk: { clientId: '54321' } });
  });

  it('Google: valid token creates an account; the same Google account signs in again; forged tokens fail', async () => {
    const t = idToken({ iss: 'https://accounts.google.com', aud: 'web.apps.googleusercontent.com', sub: 'g-1', email: 'New.Person@Example.com', email_verified: true, nonce: 'n1' });
    const r = await ctx.http.post('/v1/auth/social/google').send({ idToken: t, nonce: 'n1' }).expect(200);
    expect(r.body.user.isNew).toBe(true);
    expect((await ctx.http.get('/v1/me').set(bearer(r.body.accessToken))).body.email).toBe('new.person@example.com');
    const again = await ctx.http.post('/v1/auth/social/google').send({ idToken: t, nonce: 'n1' }).expect(200);
    expect(again.body.user.id).toBe(r.body.user.id);

    // wrong signature, wrong audience, wrong issuer, expired, wrong nonce
    await ctx.http.post('/v1/auth/social/google').send({ idToken: idToken({ iss: 'https://accounts.google.com', aud: 'web.apps.googleusercontent.com', sub: 'g-2', email: 'x@example.com', email_verified: true }, other) }).expect(401);
    await ctx.http.post('/v1/auth/social/google').send({ idToken: idToken({ iss: 'https://accounts.google.com', aud: 'someone-else', sub: 'g-2', email: 'x@example.com', email_verified: true }) }).expect(401);
    await ctx.http.post('/v1/auth/social/google').send({ idToken: idToken({ iss: 'https://evil.example', aud: 'web.apps.googleusercontent.com', sub: 'g-2', email: 'x@example.com', email_verified: true }) }).expect(401);
    await ctx.http.post('/v1/auth/social/google').send({ idToken: idToken({ iss: 'https://accounts.google.com', aud: 'web.apps.googleusercontent.com', sub: 'g-2', exp: 1000 }) }).expect(401);
    await ctx.http.post('/v1/auth/social/google').send({ idToken: t, nonce: 'other' }).expect(401);
    // an unverified email never links or creates an account
    const unverified = await ctx.http.post('/v1/auth/social/google').send({ idToken: idToken({ iss: 'https://accounts.google.com', aud: 'web.apps.googleusercontent.com', sub: 'g-3', email: 'anna@example.com', email_verified: false }) });
    expect(unverified.body.error.code).toBe('EMAIL_REQUIRED');
  });

  it('Apple links to an existing account with the same verified email', async () => {
    const a = await onboard(ctx, 'anna@example.com');
    const t = idToken({ iss: 'https://appleid.apple.com', aud: 'app.nearsoul.web', sub: 'apple-1', email: 'anna@example.com', email_verified: 'true' });
    const r = await ctx.http.post('/v1/auth/social/apple').send({ idToken: t }).expect(200);
    expect(r.body.user.id).toBe(a.userId);
    expect(r.body.user.isNew).toBe(false);
    expect(await ctx.prisma.authIdentity.count({ where: { userId: a.userId, provider: 'apple' } })).toBe(1);
  });

  it('VK ID exchanges the code on the server; web gets the refresh token as a cookie', async () => {
    const r = await ctx.http
      .post('/v1/auth/social/vk')
      .set('x-client', 'web')
      .send({ code: 'good-code', codeVerifier: 'v'.repeat(43), deviceId: 'dev', redirectUri: 'http://localhost:3000/auth/callback.html' })
      .expect(200);
    expect(r.body.refreshToken).toBeUndefined();
    expect(String(r.headers['set-cookie'])).toContain('ns_refresh=');
    expect((await ctx.http.get('/v1/me').set(bearer(r.body.accessToken))).body.email).toBe('vk.person@example.com');
    await ctx.http.post('/v1/auth/social/vk').send({ code: 'bad', codeVerifier: 'v'.repeat(43), deviceId: 'dev', redirectUri: 'http://localhost:3000/auth/callback.html' }).expect(401);
  });
});
