import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { parse } from '../../common/zod';
import { buildPairReportData } from '../../engine';
import { EngineService } from '../engine/engine.service';
import { SubjectsService } from '../discovery/subjects.service';
import { ChatService } from '../matches/chat.service';
import { ALPHA_PRESETS } from '../nearby/geo';
import { NearbyService } from '../nearby/nearby.service';
import { demoAllowed } from './demo.service';

/** ALPHA-003 / ALPHA-006 tester tools. 404 outside alpha/dev/test or for non-testers. */
@Controller('v1/alpha')
@RequireGate('active')
export class AlphaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nearby: NearbyService,
    private readonly engine: EngineService,
    private readonly subjects: SubjectsService,
    private readonly chat: ChatService,
  ) {}

  private guard(user: AuthUser) {
    if (!demoAllowed() || user.role !== 'tester') throw notFound();
  }

  @Get('presets')
  presets(@CurrentUser() user: AuthUser) {
    this.guard(user);
    return Object.entries(ALPHA_PRESETS).map(([id, p]) => ({ id, name: p.name }));
  }

  @Post('location')
  @HttpCode(200)
  location(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    this.guard(user);
    const input = parse(z.union([z.object({ presetId: z.string() }).strict(), z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).strict()]), body);
    const point = 'presetId' in input ? ALPHA_PRESETS[input.presetId] : input;
    if (!point) throw notFound('Unknown preset');
    return this.nearby.updateLocation(user.id, { lat: point.lat, lng: point.lng, accuracyM: 10 }, { simulated: true });
  }

  @Post('daily-set/reset')
  @HttpCode(204)
  async resetDaily(@CurrentUser() user: AuthUser) {
    this.guard(user);
    await this.prisma.dailySet.deleteMany({ where: { userId: user.id } });
  }

  @Get('engine-debug/me')
  async me(@CurrentUser() user: AuthUser) {
    this.guard(user);
    const row = await this.engine.getProfile(user.id);
    if (!row) throw notFound();
    return { domains: row.profile.domains, quality: row.profile.quality, depth: row.profile.depth, archetype: row.profile.archetype, engineVersion: row.profile.engineVersion };
  }

  @Get('engine-debug/match/:id')
  async match(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    this.guard(user);
    const { otherId } = await this.chat.participantMatch(user.id, id);
    const subjects = await this.subjects.load([user.id, otherId]);
    const me = subjects.get(user.id)!;
    const other = subjects.get(otherId)!;
    const otherUser = await this.prisma.user.findUniqueOrThrow({ where: { id: otherId }, select: { role: true } });
    // Only when both are testers who chose the deep share level (never raw answers).
    if (otherUser.role !== 'tester' || me.shareLevel !== 'deep' || other.shareLevel !== 'deep') throw notFound();
    const compat = this.subjects.compat(me, other, await this.engine.matchConfig())!;
    const data = buildPairReportData(me.profile!, other.profile!, compat, 'deep', 'deep');
    return { score: compat.score, tier: compat.tier, confidence: compat.confidence, layers: compat.layers, reasons: compat.reasons, frictions: compat.frictions, tips: data.tips, configVersion: compat.configVersion };
  }
}
