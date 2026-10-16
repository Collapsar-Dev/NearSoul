import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { localeFrom } from '../engine/engine.controller';
import { NearbyService } from './nearby.service';

@Controller('v1')
@RequireGate('active')
export class NearbyController {
  constructor(private readonly nearby: NearbyService) {}

  @Post('location')
  @HttpCode(200)
  location(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracyM: z.number().min(0).max(100_000), capturedAt: z.string().optional() }).strict(), body);
    return this.nearby.updateLocation(user.id, input);
  }

  @Post('nearby/open')
  @HttpCode(200)
  open(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(
      z.object({
        durationMin: z.union([z.literal(60), z.literal(120), z.literal(240)]),
        radiusM: z.number().int(),
        activity: z.enum(['coffee', 'walk', 'drinks', 'chat']).nullable().optional(),
      }).strict(),
      body,
    );
    return this.nearby.open(user.id, input);
  }

  @Post('nearby/close')
  @HttpCode(200)
  close(@CurrentUser() user: AuthUser) {
    return this.nearby.close(user.id);
  }

  @Get('nearby/status')
  status(@CurrentUser() user: AuthUser) {
    return this.nearby.status(user.id);
  }

  @Get('nearby/list')
  list(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    return this.nearby.list(user.id, localeFrom(lang));
  }

  @Post('nearby/later')
  @HttpCode(204)
  async later(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { userId } = parse(z.object({ userId: z.string().uuid() }).strict(), body);
    await this.nearby.later(user.id, userId);
  }
}
