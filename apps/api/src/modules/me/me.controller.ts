import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { MeService } from './me.service';

@Controller('v1/me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.me.me(user.id);
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const data = parse(
      z.object({
        discoveryEnabled: z.boolean(),
        hideDistance: z.boolean(),
        readReceipts: z.boolean(),
        cardVisibility: z.enum(['everyone', 'matches_only', 'hidden']),
        flexibleFallback: z.boolean(),
        locale: z.enum(['en', 'ru']),
        timezone: z.string().min(3).max(64),
      }).partial().strict(),
      body,
    );
    await this.me.updateSettings(user.id, data);
    return this.me.me(user.id);
  }

  @Post('dob')
  @HttpCode(200)
  dob(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { dob } = parse(z.object({ dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict(), body);
    return this.me.setDob(user.id, dob);
  }

  @Get('consents')
  consents(@CurrentUser() user: AuthUser) {
    return this.me.latestConsents(user.id);
  }

  @Post('consents')
  @HttpCode(200)
  setConsents(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(
      z.object({
        terms: z.boolean().optional(),
        alphaTerms: z.boolean().optional(),
        optional: z.object({ product_emails: z.boolean(), analytics: z.boolean(), ai_writing: z.boolean() }).partial().strict().optional(),
      }).strict(),
      body,
    );
    return this.me.setConsents(user.id, input);
  }

  @Patch('share-level')
  @RequireGate('age')
  @HttpCode(204)
  async shareLevel(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { level } = parse(z.object({ level: z.enum(['minimal', 'standard', 'deep']) }).strict(), body);
    await this.me.setShareLevel(user.id, level);
  }

  @Post('onboarding/complete')
  @RequireGate('age')
  @HttpCode(200)
  complete(@CurrentUser() user: AuthUser) {
    return this.me.completeOnboarding(user.id);
  }

  @Post('delete')
  @HttpCode(202)
  async delete(@CurrentUser() user: AuthUser) {
    await this.me.requestDeletion(user.id);
    return { status: 'deletion_requested' };
  }
}
