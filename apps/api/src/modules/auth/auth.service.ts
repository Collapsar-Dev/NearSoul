import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { hmac, randomToken, safeEqualHex, sha256, sixDigitCode } from '../../common/crypto';
import { AppError, badRequest, tooMany } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import { InvitesService } from '../invites/invites.service';
import { EmailService } from './email.service';

const CODE_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const CODES_PER_WINDOW = 3;
const CODE_WINDOW_MS = 15 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
export const REFRESH_TTL_MS = 30 * 86_400_000;
const ACCESS_TTL_SEC = 15 * 60;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly limiter: RateLimiter,
    private readonly invites: InvitesService,
  ) {}

  private codeHash(email: string, code: string) {
    return hmac(env().JWT_SECRET, `${email}:${code}`);
  }

  /** AUTH-001: identical response whether or not the account exists. */
  async requestCode(rawEmail: string, ip: string): Promise<void> {
    const email = normalizeEmail(rawEmail);
    this.limiter.check(`code-ip:${ip}`, 10, 3_600_000);
    const since = new Date(Date.now() - CODE_WINDOW_MS);
    const recent = await this.prisma.authCode.findMany({
      where: { email, purpose: 'login', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    const last = recent[0];
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw tooMany(Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime())) / 1000));
    }
    if (recent.length >= CODES_PER_WINDOW) {
      const oldest = recent[recent.length - 1] as { createdAt: Date };
      throw tooMany(Math.ceil((oldest.createdAt.getTime() + CODE_WINDOW_MS - Date.now()) / 1000));
    }
    const code = sixDigitCode();
    // Only one live code per email: older ones are invalidated.
    await this.prisma.authCode.updateMany({ where: { email, purpose: 'login', usedAt: null }, data: { usedAt: new Date() } });
    await this.prisma.authCode.create({
      data: { email, purpose: 'login', codeHash: this.codeHash(email, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    });
    await this.email.send({
      to: email,
      subject: `${code} is your NearSoul code`,
      text: `Your NearSoul sign-in code is ${code}.\n\nIt expires in 10 minutes. If you didn't ask for it, you can ignore this email.`,
    });
  }

  /** AUTH-002: verify the code, create the account if new (invite required when INVITE_ONLY). */
  async verify(input: { email: string; code: string; deviceId?: string; platform?: string; inviteCode?: string }, ip: string) {
    const email = normalizeEmail(input.email);
    this.limiter.check(`verify-ip:${ip}`, 30, 3_600_000);
    const record = await this.prisma.authCode.findFirst({
      where: { email, purpose: 'login', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    const invalid = new AppError(400, 'INVALID_CODE', 'That code is wrong or has expired.');
    if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) throw invalid;
    if (!/^\d{6}$/.test(input.code) || !safeEqualHex(record.codeHash, this.codeHash(email, input.code))) {
      const attempts = record.attempts + 1;
      await this.prisma.authCode.update({
        where: { id: record.id },
        data: { attempts, ...(attempts >= MAX_ATTEMPTS ? { usedAt: new Date() } : {}) },
      });
      throw invalid;
    }
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (env().INVITE_ONLY && !input.inviteCode) throw badRequest('INVITE_REQUIRED', 'NearSoul is invite-only right now. Please enter your invite code.');
      user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            role: env().APP_ENV === 'alpha' ? 'tester' : 'user',
            invitesLeft: env().INVITE_ONLY ? 3 : 0,
          },
        });
        if (env().INVITE_ONLY && input.inviteCode) await this.invites.redeem(tx, input.inviteCode, created.id);
        return created;
      });
    }
    await this.prisma.authCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    const tokens = await this.issue(user.id, randomUUID(), input.deviceId, input.platform);
    return { tokens, user: { id: user.id, isNew: user.status === 'onboarding' && !user.dob } };
  }

  private async issue(userId: string, familyId: string, deviceId?: string, platform?: string): Promise<TokenPair & { sessionId: string }> {
    const refreshToken = randomToken();
    const session = await this.prisma.session.create({
      data: { userId, familyId, refreshTokenHash: sha256(refreshToken), deviceId, platform },
    });
    const accessToken = await this.jwt.signAsync({ sub: userId, sid: session.id }, { secret: env().JWT_SECRET, expiresIn: ACCESS_TTL_SEC });
    return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SEC, sessionId: session.id };
  }

  /** AUTH-003: rotate; reuse of a rotated token revokes the whole family. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const unauth = new AppError(401, 'UNAUTHENTICATED', 'Please sign in again.');
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: sha256(refreshToken) }, include: { user: true } });
    if (!session) throw unauth;
    if (session.revokedAt || session.replacedById) {
      await this.prisma.session.updateMany({ where: { familyId: session.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.prisma.auditEvent.create({
        data: { actorType: 'system', action: 'refresh_token_reuse', targetType: 'user', targetId: session.userId },
      });
      throw unauth;
    }
    if (session.createdAt.getTime() + REFRESH_TTL_MS < Date.now() || ['deleted', 'deletion_requested', 'suspended'].includes(session.user.status)) {
      throw unauth;
    }
    const next = await this.issue(session.userId, session.familyId, session.deviceId ?? undefined, session.platform ?? undefined);
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date(), replacedById: next.sessionId } });
    await this.prisma.user.update({ where: { id: session.userId }, data: { lastActiveAt: new Date() } });
    return { accessToken: next.accessToken, refreshToken: next.refreshToken, expiresIn: next.expiresIn };
  }

  /** AUTH-005: a fresh code for high-risk actions (account deletion, email change). */
  async requestSensitiveCode(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const recent = await this.prisma.authCode.findFirst({ where: { email: user.email, purpose: 'sensitive_action', createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) } } });
    if (recent) throw tooMany(60);
    const code = sixDigitCode();
    await this.prisma.authCode.updateMany({ where: { email: user.email, purpose: 'sensitive_action', usedAt: null }, data: { usedAt: new Date() } });
    await this.prisma.authCode.create({ data: { email: user.email, purpose: 'sensitive_action', codeHash: this.codeHash(user.email, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
    await this.email.send({ to: user.email, subject: `${code} confirms your NearSoul request`, text: `Your confirmation code is ${code}. It expires in 10 minutes.\n\nIf you didn't ask to delete your account or change your email, ignore this email and consider signing out of all devices.` });
  }

  async verifySensitiveCode(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const record = await this.prisma.authCode.findFirst({ where: { email: user.email, purpose: 'sensitive_action', usedAt: null }, orderBy: { createdAt: 'desc' } });
    const invalid = new AppError(400, 'INVALID_CODE', 'That code is wrong or has expired.');
    if (!record || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) throw invalid;
    if (!/^\d{6}$/.test(code) || !safeEqualHex(record.codeHash, this.codeHash(user.email, code))) {
      await this.prisma.authCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw invalid;
    }
    await this.prisma.authCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.prisma.deviceToken.deleteMany({ where: { sessionId } });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
