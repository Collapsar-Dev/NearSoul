import { Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { parse } from '../../common/zod';
import { localeFrom } from '../engine/engine.controller';
import { CardService } from './card.service';

@Controller('v1/me/card')
@RequireGate('age')
export class CardController {
  constructor(private readonly cards: CardService) {}

  @Post('generate')
  generate(@CurrentUser() user: AuthUser, @Body() body: unknown, @Headers('accept-language') lang?: string) {
    const { force } = parse(z.object({ force: z.boolean().optional() }).strict(), body ?? {});
    return this.cards.generate(user.id, localeFrom(lang), force);
  }

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cards.get(user.id);
  }

  @Patch()
  edit(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = parse(
      z.object({
        headline: z.string().trim().min(3).max(60),
        summary: z.string().trim().min(10).max(300),
        communication_style: z.string().trim().min(5).max(140),
        ideal_first_date: z.string().trim().min(5).max(140),
        strengths: z.array(z.string().trim().min(2).max(20)).length(3),
        reviewed: z.boolean(),
      }).partial().strict(),
      body,
    );
    return this.cards.edit(user.id, input);
  }
}
