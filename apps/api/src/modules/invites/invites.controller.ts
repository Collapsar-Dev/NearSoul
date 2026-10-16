import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { CurrentUser, Public, type AuthUser } from '../../common/auth';
import { RateLimiter } from '../../common/rate-limit';
import { parse } from '../../common/zod';
import { InvitesService } from './invites.service';

@Controller('v1')
export class InvitesController {
  constructor(private readonly invites: InvitesService, private readonly limiter: RateLimiter) {}

  @Public()
  @Post('invites/validate')
  @HttpCode(200)
  async validate(@Body() body: unknown, @Req() req: Request) {
    this.limiter.check(`invite-validate:${req.ip}`, 10, 3_600_000);
    const { code } = parse(z.object({ code: z.string().trim().min(4).max(16) }).strict(), body);
    return { valid: await this.invites.validate(code) };
  }

  @Get('me/invites')
  mine(@CurrentUser() user: AuthUser) {
    return this.invites.mine(user.id);
  }

  @Post('me/invites')
  async create(@CurrentUser() user: AuthUser) {
    return { code: await this.invites.createForUser(user.id) };
  }
}
