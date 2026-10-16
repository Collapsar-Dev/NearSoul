import { Body, Controller, Delete, Get, Headers, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { badRequest } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { parse } from '../../common/zod';
import { localeFrom } from '../engine/engine.controller';
import { SoulService } from './soul.service';

/** Soul Talk (SOUL-001..008). Owner-only; 404 when the feature flag is off. No admin route exists for this data. */
@Controller('v1')
@RequireGate('active')
export class SoulController {
  constructor(private readonly soul: SoulService, private readonly prisma: PrismaService) {}

  private async country(userId: string): Promise<string> {
    const p = await this.prisma.profile.findUnique({ where: { userId }, include: { city: true } });
    return p?.city?.countryCode ?? 'default';
  }

  @Get('soul/topics')
  async topics(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    await this.soul.assertAllowed(user.id);
    return this.soul.topics(user.id, localeFrom(lang));
  }

  @Post('soul/sessions')
  async start(@CurrentUser() user: AuthUser, @Body() body: unknown, @Headers('accept-language') lang?: string) {
    await this.soul.assertAllowed(user.id);
    const { topicKey } = parse(z.object({ topicKey: z.string().max(40) }).strict(), body);
    return this.soul.start(user.id, topicKey, localeFrom(lang));
  }

  @Get('soul/sessions')
  async list(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    await this.soul.assertAllowed(user.id);
    return this.soul.list(user.id, localeFrom(lang));
  }

  @Get('soul/sessions/:id')
  async get(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('accept-language') lang?: string) {
    await this.soul.assertAllowed(user.id);
    return this.soul.get(user.id, id, localeFrom(lang));
  }

  @Post('soul/sessions/:id/messages')
  @HttpCode(200)
  async send(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idem?: string,
    @Headers('accept-language') lang?: string,
  ) {
    await this.soul.assertAllowed(user.id);
    if (!idem || !/^[\w-]{8,64}$/.test(idem)) throw badRequest('IDEMPOTENCY_KEY_REQUIRED', 'Missing Idempotency-Key header.');
    const { text } = parse(z.object({ text: z.string().max(2000) }).strict(), body);
    return this.soul.send(user.id, id, text, idem, localeFrom(lang), await this.country(user.id));
  }

  @Post('soul/sessions/:id/continue')
  @HttpCode(204)
  async resume(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.soul.assertAllowed(user.id);
    await this.soul.resume(user.id, id);
  }

  @Post('soul/sessions/:id/finish')
  @HttpCode(200)
  async finish(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('accept-language') lang?: string) {
    await this.soul.assertAllowed(user.id);
    return this.soul.finish(user.id, id, localeFrom(lang));
  }

  @Delete('soul/sessions/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.soul.assertAllowed(user.id);
    await this.soul.deleteSession(user.id, id);
  }

  @Delete('soul/data')
  @HttpCode(204)
  async removeAll(@CurrentUser() user: AuthUser) {
    await this.soul.assertAllowed(user.id);
    await this.soul.deleteAll(user.id);
  }

  @Get('soul/insights')
  async insights(@CurrentUser() user: AuthUser) {
    await this.soul.assertAllowed(user.id);
    return this.soul.insights(user.id);
  }

  @Patch('soul/insights/:id')
  async update(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    await this.soul.assertAllowed(user.id);
    const input = parse(
      z.object({ status: z.enum(['kept', 'discarded']), text: z.string().trim().min(3).max(140), visibility: z.enum(['private', 'matching', 'card']) }).partial().strict(),
      body,
    );
    return this.soul.updateInsight(user.id, id, input);
  }

  @Get('me/soul-map')
  async map(@CurrentUser() user: AuthUser) {
    await this.soul.assertAllowed(user.id);
    return this.soul.soulMap(user.id);
  }

  @Patch('me/soul-settings')
  async settings(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    await this.soul.assertAllowed(user.id);
    const { keepConversations } = parse(z.object({ keepConversations: z.boolean() }).strict(), body);
    return this.soul.settings(user.id, keepConversations);
  }
}
