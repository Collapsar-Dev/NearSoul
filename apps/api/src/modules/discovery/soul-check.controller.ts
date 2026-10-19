import { Controller, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { localeFrom } from '../engine/engine.controller';
import { SoulCheckService } from './soul-check.service';

/** CR-31: compatibility check by personal link. Only the age gate: a friend can check right after the 10 questions. */
@Controller('v1')
@RequireGate('age')
export class SoulCheckController {
  constructor(private readonly checks: SoulCheckService) {}

  @Get('me/soul-link')
  link(@CurrentUser() user: AuthUser) {
    return this.checks.myLink(user.id);
  }

  @Get('me/soul-checks')
  list(@CurrentUser() user: AuthUser) {
    return this.checks.list(user.id);
  }

  @Get('soul-links/:code')
  preview(@CurrentUser() user: AuthUser, @Param('code') code: string, @Headers('accept-language') lang?: string) {
    return this.checks.preview(code, user.id, localeFrom(lang));
  }

  @Post('soul-links/:code/check')
  @HttpCode(200)
  check(@CurrentUser() user: AuthUser, @Param('code') code: string, @Headers('accept-language') lang?: string) {
    return this.checks.check(code, user.id, localeFrom(lang));
  }
}
