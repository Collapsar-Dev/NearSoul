import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { authenticator } from 'otplib';
import type { Request } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';

export type AdminRole = 'moderator' | 'support' | 'admin';
export interface AdminPrincipal { id: string; role: AdminRole; email: string }

const ROLES = 'ns:admin-roles';
/** Marks a route as admin-only with the allowed roles (admin always allowed). */
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ROLES, roles);
export const CurrentAdmin = createParamDecorator((_d: unknown, ctx: ExecutionContext): AdminPrincipal => ctx.switchToHttp().getRequest<Request & { admin: AdminPrincipal }>().admin);

const adminSecret = () => `${env().JWT_SECRET}:admin`;

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly limiter: RateLimiter) {}

  async login(email: string, password: string, totp: string, ip: string) {
    this.limiter.check(`admin-login:${ip}`, 10, 15 * 60_000);
    const invalid = new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
    const admin = await this.prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!admin || !admin.active) {
      await argon2.hash(password); // equalize timing
      throw invalid;
    }
    if (!(await argon2.verify(admin.passwordHash, password))) throw invalid;
    if (!admin.mfaSecret || !authenticator.check(totp, admin.mfaSecret)) throw invalid;
    await this.prisma.auditEvent.create({ data: { actorType: 'admin', actorId: admin.id, action: 'admin_login' } });
    const token = await this.jwt.signAsync({ sub: admin.id, role: admin.role, aud: 'admin' }, { secret: adminSecret(), expiresIn: '8h' });
    return { token, role: admin.role };
  }
}

/** Admin routes are @Public() for the user guard and protected here with a separate token. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles) return true;
    const req = ctx.switchToHttp().getRequest<Request & { admin?: AdminPrincipal }>();
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    let payload: { sub: string; role: AdminRole; aud: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: adminSecret() });
    } catch {
      throw new AppError(401, 'UNAUTHENTICATED', 'Admin sign-in required.');
    }
    if (payload.aud !== 'admin') throw new AppError(401, 'UNAUTHENTICATED', 'Admin sign-in required.');
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin?.active) throw new AppError(401, 'UNAUTHENTICATED', 'Admin sign-in required.');
    if (admin.role !== 'admin' && !roles.includes(admin.role as AdminRole)) throw new AppError(403, 'FORBIDDEN', 'Your role can’t do that.');
    req.admin = { id: admin.id, role: admin.role as AdminRole, email: admin.email };
    return true;
  }
}
