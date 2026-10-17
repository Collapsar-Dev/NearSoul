import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, Public, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { BillingService } from './billing.service';

const EventSchema = z.object({
  event: z.object({
    id: z.string().min(1).max(200),
    type: z.string().max(60),
    app_user_id: z.string().max(200).optional(),
    original_app_user_id: z.string().max(200).optional(),
    aliases: z.array(z.string().max(200)).max(50).optional(),
    product_id: z.string().max(200).optional(),
    entitlement_ids: z.array(z.string().max(100)).max(20).nullable().optional(),
    expiration_at_ms: z.number().nullable().optional(),
    environment: z.string().max(20).optional(),
    store: z.string().max(40).optional(),
  }).passthrough(),
}).passthrough();

@Controller('v1/billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.billing.status(user.id);
  }

  /** Alpha/dev only: try any level without paying (CR-18). */
  @Post('test-activate')
  @HttpCode(200)
  testActivate(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { tier } = parse(z.object({ tier: z.enum(['free', 'plus', 'gold', 'vip']) }).strict(), body);
    return this.billing.testActivate(user.id, tier);
  }

  /** RevenueCat webhook: authenticated by a shared Authorization header, not by a user token. */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Headers('authorization') auth: string | undefined, @Body() body: unknown) {
    this.billing.verify(auth);
    const { event } = parse(EventSchema, body);
    return this.billing.handle(event);
  }
}
