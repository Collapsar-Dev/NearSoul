import { Injectable } from '@nestjs/common';
import { createPublicKey, verify as cryptoVerify, type JsonWebKey } from 'node:crypto';
import { AppError, badRequest } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import { env } from '../../config/env';
import { AuthService, normalizeEmail } from './auth.service';

export type SocialProvider = 'google' | 'apple' | 'vk';

const GOOGLE = { jwks: 'https://www.googleapis.com/oauth2/v3/certs', issuers: ['https://accounts.google.com', 'accounts.google.com'] };
const APPLE = { jwks: 'https://appleid.apple.com/auth/keys', issuers: ['https://appleid.apple.com'] };
const JWKS_TTL_MS = 3_600_000;

export interface SocialIdentity {
  subject: string;
  email: string | null;
  emailVerified: boolean;
}

const list = (v?: string) => (v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const b64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const invalid = () => new AppError(401, 'SOCIAL_TOKEN_INVALID', 'Sign-in didn’t work. Please try again.');

/**
 * AUTH-006 / CR-33: Sign in with Google, Apple or VK ID. Tokens are verified on the server (signature against the
 * provider's published keys, issuer, audience = our client id, expiry, nonce). Accounts are linked by a verified
 * email only, so a social login can never take over someone else's account.
 */
@Injectable()
export class SocialAuthService {
  private readonly jwksCache = new Map<string, { at: number; keys: (JsonWebKey & { kid?: string })[] }>();

  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService, private readonly limiter: RateLimiter) {}

  /** Which buttons can work, and the public client ids the web app needs. No secrets here. */
  providers() {
    const google = list(env().GOOGLE_CLIENT_IDS)[0] ?? null;
    const apple = list(env().APPLE_CLIENT_IDS)[0] ?? null;
    const vk = env().VK_CLIENT_ID ?? null;
    return { google: google ? { clientId: google } : null, apple: apple ? { clientId: apple } : null, vk: vk ? { clientId: vk } : null };
  }

  /** Overridable in tests. */
  async fetchJson(url: string, init?: RequestInit): Promise<unknown> {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    if (!r.ok) throw invalid();
    return r.json();
  }

  private async jwks(url: string) {
    const hit = this.jwksCache.get(url);
    if (hit && Date.now() - hit.at < JWKS_TTL_MS) return hit.keys;
    const body = (await this.fetchJson(url)) as { keys?: (JsonWebKey & { kid?: string })[] };
    const keys = body.keys ?? [];
    this.jwksCache.set(url, { at: Date.now(), keys });
    return keys;
  }

  /** RS256 ID token check. Returns the claims or throws 401. */
  async verifyIdToken(token: string, cfg: { jwks: string; issuers: string[] }, audiences: string[], nonce?: string): Promise<Record<string, unknown>> {
    const parts = token.split('.');
    if (parts.length !== 3) throw invalid();
    let header: { alg?: string; kid?: string };
    let claims: Record<string, unknown>;
    try {
      header = JSON.parse(b64url(parts[0]!).toString('utf8'));
      claims = JSON.parse(b64url(parts[1]!).toString('utf8'));
    } catch {
      throw invalid();
    }
    if (header.alg !== 'RS256' || !header.kid) throw invalid();
    let jwk = (await this.jwks(cfg.jwks)).find((k) => k.kid === header.kid);
    if (!jwk) {
      this.jwksCache.delete(cfg.jwks); // keys rotated
      jwk = (await this.jwks(cfg.jwks)).find((k) => k.kid === header.kid);
    }
    if (!jwk) throw invalid();
    const ok = cryptoVerify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: 'jwk' }), b64url(parts[2]!));
    if (!ok) throw invalid();
    const now = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(claims.aud) ? (claims.aud as string[]) : [claims.aud as string];
    if (!cfg.issuers.includes(claims.iss as string)) throw invalid();
    if (!aud.some((a) => audiences.includes(a))) throw invalid();
    if (typeof claims.exp !== 'number' || claims.exp < now - 60) throw invalid();
    if (nonce !== undefined && claims.nonce !== nonce) throw invalid();
    return claims;
  }

  async identity(provider: SocialProvider, input: { idToken?: string; nonce?: string; code?: string; codeVerifier?: string; deviceId?: string; redirectUri?: string }): Promise<SocialIdentity> {
    try {
      return await this.identityUnsafe(provider, input);
    } catch (e) {
      // Network or provider errors never leak details; the person just tries again.
      if (e instanceof AppError) throw e;
      throw invalid();
    }
  }

  private async identityUnsafe(provider: SocialProvider, input: Parameters<SocialAuthService['identity']>[1]): Promise<SocialIdentity> {
    if (provider === 'google') {
      const audiences = list(env().GOOGLE_CLIENT_IDS);
      if (!audiences.length) throw new AppError(503, 'PROVIDER_OFF', 'Google sign-in isn’t set up yet.');
      if (!input.idToken) throw badRequest('MISSING_TOKEN', 'Missing token.');
      const c = await this.verifyIdToken(input.idToken, GOOGLE, audiences, input.nonce);
      return { subject: String(c.sub), email: typeof c.email === 'string' ? c.email : null, emailVerified: c.email_verified === true || c.email_verified === 'true' };
    }
    if (provider === 'apple') {
      const audiences = list(env().APPLE_CLIENT_IDS);
      if (!audiences.length) throw new AppError(503, 'PROVIDER_OFF', 'Apple sign-in isn’t set up yet.');
      if (!input.idToken) throw badRequest('MISSING_TOKEN', 'Missing token.');
      const c = await this.verifyIdToken(input.idToken, APPLE, audiences, input.nonce);
      // Apple only issues addresses it has verified (including private relay addresses).
      return { subject: String(c.sub), email: typeof c.email === 'string' ? c.email : null, emailVerified: c.email_verified === true || c.email_verified === 'true' };
    }
    // VK ID (OAuth 2.1 + PKCE): exchange the code on the server, then read the profile.
    const clientId = env().VK_CLIENT_ID;
    if (!clientId) throw new AppError(503, 'PROVIDER_OFF', 'VK sign-in isn’t set up yet.');
    if (!input.code || !input.codeVerifier || !input.deviceId || !input.redirectUri) throw badRequest('MISSING_TOKEN', 'Missing code.');
    const token = (await this.fetchJson('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: input.code, code_verifier: input.codeVerifier, client_id: clientId, device_id: input.deviceId, redirect_uri: input.redirectUri }),
    })) as { access_token?: string; user_id?: number | string };
    if (!token.access_token) throw invalid();
    const info = (await this.fetchJson('https://id.vk.com/oauth2/user_info', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, access_token: token.access_token }),
    })) as { user?: { user_id?: string | number; email?: string } };
    const id = info.user?.user_id ?? token.user_id;
    if (!id) throw invalid();
    // VK only returns an address the person confirmed in VK and agreed to share.
    return { subject: String(id), email: info.user?.email ?? null, emailVerified: !!info.user?.email };
  }

  async signIn(provider: SocialProvider, input: Parameters<SocialAuthService['identity']>[1] & { inviteCode?: string; platform?: string; clientDeviceId?: string }, ip: string) {
    this.limiter.check(`social-ip:${ip}`, 30, 3_600_000);
    const id = await this.identity(provider, input);
    const linked = await this.prisma.authIdentity.findUnique({ where: { provider_subject: { provider, subject: id.subject } }, include: { user: true } });
    let user = linked?.user ?? null;
    if (!user) {
      if (!id.email || !id.emailVerified) throw badRequest('EMAIL_REQUIRED', 'Please allow sharing your email, or sign in with an email code.');
      const email = normalizeEmail(id.email);
      user = (await this.prisma.user.findUnique({ where: { email } })) ?? (await this.auth.createUser(email, input.inviteCode, input.platform));
      await this.prisma.authIdentity.create({ data: { provider, subject: id.subject, userId: user.id, email } });
    }
    if (['deleted', 'deletion_requested'].includes(user.status)) throw new AppError(403, 'ACCOUNT_DELETED', 'This account was deleted.');
    return this.auth.signedIn(user, input.clientDeviceId, input.platform);
  }
}
