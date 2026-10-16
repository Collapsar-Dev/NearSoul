import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { env } from '../config/env';
import { AppError, forbidden } from './errors';
import { PrismaService } from './prisma.service';

export interface AuthUser {
  id: string;
  sessionId: string;
  role: 'user' | 'tester';
  status: string;
  ageGatePassed: boolean;
}

export type AuthedRequest = Request & { user: AuthUser; requestId?: string };

const PUBLIC = 'ns:public';
const GATE = 'ns:gate';
export type Gate = 'age' | 'active';

/** Route needs no authentication. */
export const Public = () => SetMetadata(PUBLIC, true);
/** 'age': age gate + current Terms consent. 'active': also a completed onboarding (dating features). */
export const RequireGate = (gate: Gate) => SetMetadata(GATE, gate);

export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user;
});

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, targets)) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in.');
    let payload: { sub: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: env().JWT_SECRET });
    } catch {
      throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in again.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true, ageGatePassedAt: true },
    });
    if (!user || user.status === 'deleted' || user.status === 'deletion_requested' || user.status === 'suspended') {
      throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in again.');
    }
    req.user = { id: user.id, sessionId: payload.sid, role: user.role, status: user.status, ageGatePassed: !!user.ageGatePassedAt };
    const gate = this.reflector.getAllAndOverride<Gate | undefined>(GATE, targets);
    if (gate) {
      if (user.status === 'blocked_underage' || !user.ageGatePassedAt) throw forbidden('AGE_GATE', 'Please confirm your age first.');
      const terms = await this.prisma.consent.findFirst({
        where: { userId: user.id, type: 'terms', version: env().TERMS_VERSION },
        orderBy: { createdAt: 'desc' },
      });
      if (!terms?.granted) throw forbidden('TERMS_REQUIRED', 'Please accept the Terms first.');
      if (gate === 'active' && user.status !== 'active') throw forbidden('ONBOARDING', 'Please finish setting up your profile.');
    }
    return true;
  }
}
