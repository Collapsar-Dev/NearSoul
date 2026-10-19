import { Body, Controller, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { CurrentUser, Public, type AuthUser } from '../../common/auth';
import { AppError } from '../../common/errors';
import { parse } from '../../common/zod';
import { AuthService, REFRESH_TTL_MS, type TokenPair } from './auth.service';
import { SocialAuthService } from './social-auth.service';

const REFRESH_COOKIE = 'ns_refresh';
const emailSchema = z.string().trim().email().max(254);

/** Web clients send `X-Client: web` and get the refresh token as an httpOnly cookie (PLAT-004). */
const isWeb = (req: Request) => req.header('x-client') === 'web';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env().APP_ENV !== 'development' && env().APP_ENV !== 'test',
    sameSite: 'strict',
    path: '/v1/auth',
    domain: env().COOKIE_DOMAIN,
    maxAge: REFRESH_TTL_MS,
  });
}

function tokenResponse(req: Request, res: Response, t: TokenPair) {
  if (isWeb(req)) {
    setRefreshCookie(res, t.refreshToken);
    return { accessToken: t.accessToken, expiresIn: t.expiresIn };
  }
  return t;
}

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly social: SocialAuthService) {}

  @Public()
  @Post('code')
  @HttpCode(202)
  async code(@Body() body: unknown, @Req() req: Request) {
    const { email } = parse(z.object({ email: emailSchema }).strict(), body);
    const testCode = await this.auth.requestCode(email, req.ip ?? 'unknown');
    return { status: 'sent', ...(testCode ? { testCode } : {}) };
  }

  @Public()
  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const input = parse(
      z.object({
        email: emailSchema,
        code: z.string().trim().max(12),
        deviceId: z.string().max(100).optional(),
        platform: z.enum(['web', 'android', 'ios', 'windows', 'macos', 'linux']).optional(),
        inviteCode: z.string().trim().toUpperCase().max(16).optional(),
      }).strict(),
      body,
    );
    const { tokens, user } = await this.auth.verify(input, req.ip ?? 'unknown');
    return { ...tokenResponse(req, res, tokens), user };
  }

  /** CR-33: which social sign-in buttons are live (public client ids only). */
  @Public()
  @Get('providers')
  providers() {
    return this.social.providers();
  }

  @Public()
  @Post('social/:provider')
  @HttpCode(200)
  async socialSignIn(@Param('provider') provider: string, @Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const p = parse(z.enum(['google', 'apple', 'vk']), provider);
    const input = parse(
      z.object({
        idToken: z.string().max(5000).optional(),
        nonce: z.string().max(200).optional(),
        code: z.string().max(2000).optional(),
        codeVerifier: z.string().max(200).optional(),
        deviceId: z.string().max(200).optional(),
        redirectUri: z.string().url().max(500).optional(),
        clientDeviceId: z.string().max(100).optional(),
        platform: z.enum(['web', 'android', 'ios', 'windows', 'macos', 'linux']).optional(),
        inviteCode: z.string().trim().toUpperCase().max(16).optional(),
      }).strict(),
      body,
    );
    const { tokens, user } = await this.social.signIn(p, input, req.ip ?? 'unknown');
    return { ...tokenResponse(req, res, tokens), user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    let token: string | undefined;
    if (isWeb(req)) {
      // CSRF: SameSite=Strict cookie + a custom header that simple cross-site forms can't send.
      if (req.header('x-requested-with') !== 'NearSoul') throw new AppError(403, 'CSRF', 'Forbidden');
      token = (req as Request & { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE];
    } else {
      token = parse(z.object({ refreshToken: z.string().min(10).max(200) }).strict(), body).refreshToken;
    }
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in again.');
    return tokenResponse(req, res, await this.auth.refresh(token));
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user.sessionId);
    res.clearCookie(REFRESH_COOKIE, { path: '/v1/auth', domain: env().COOKIE_DOMAIN });
  }

  /** CR-17: move this device to another profile of the same account. */
  @Post('switch')
  @HttpCode(200)
  async switchPersona(@CurrentUser() user: AuthUser, @Body() body: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { personaId } = parse(z.object({ personaId: z.string().uuid() }).strict(), body);
    return tokenResponse(req, res, await this.auth.switchPersona(user, personaId));
  }

  @Post('logout-all')
  @HttpCode(204)
  async logoutAll(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/v1/auth', domain: env().COOKIE_DOMAIN });
  }
}
