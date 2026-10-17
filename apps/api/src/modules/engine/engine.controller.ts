import { Body, Controller, Get, Headers, Param, Patch, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { notFound } from '../../common/errors';
import { parse } from '../../common/zod';
import { EngineService, type Locale } from './engine.service';
import { buildSelfReportData } from '../../engine';

export const localeFrom = (h?: string): Locale => (h?.toLowerCase().startsWith('ru') ? 'ru' : 'en');

const LAYER_EDITABLE = z.object({
  conflict_style: z.enum(['talk_now', 'cool_down_then_talk', 'let_it_go']),
  care_language: z.array(z.enum(['words', 'time', 'help', 'gifts', 'touch'])).min(1).max(2),
  values: z.array(z.enum(['family', 'career', 'adventure', 'stability', 'growth', 'creativity', 'health', 'faith', 'freedom', 'community'])).length(3),
  kids_plan: z.enum(['have_want_more', 'have_no_more', 'want', 'dont_want', 'open', 'not_sure']),
  life_direction: z.enum(['settle_build', 'grow_career', 'explore_world', 'balance_all']),
  weekend_style: z.enum(['cozy_home', 'outdoors_active', 'social_out', 'culture_explore', 'mix']),
  activity_level: z.enum(['low', 'moderate', 'high', 'very_high']),
  smoking: z.enum(['never', 'socially', 'regularly']),
  drinking: z.enum(['never', 'rarely', 'socially', 'often']),
  texting_rhythm: z.enum(['all_day', 'few_times_day', 'daily_checkin', 'prefer_meeting']),
}).partial().strict();

@Controller('v1')
@RequireGate('age')
export class EngineController {
  constructor(private readonly engine: EngineService) {}

  @Get('engine/questionnaires/:id')
  questionnaire(@Param('id') id: string, @Headers('accept-language') lang?: string) {
    return this.engine.questionnaire(localeFrom(lang), id);
  }

  @Put('engine/answers/:itemKey')
  async answer(@CurrentUser() user: AuthUser, @Param('itemKey') itemKey: string, @Body() body: unknown, @Headers('accept-language') lang?: string) {
    const { value } = parse(z.object({ value: z.union([z.number(), z.string(), z.array(z.string()), z.null()]) }).strict(), body);
    const profile = await this.engine.saveAnswer(user.id, itemKey, value, localeFrom(lang));
    return { saved: true, quickScanComplete: profile.quickScanComplete };
  }

  @Get('engine/progress')
  progress(@CurrentUser() user: AuthUser) {
    return this.engine.progress(user.id);
  }

  @Get('me/soul-profile')
  async soulProfile(@CurrentUser() user: AuthUser) {
    const row = (await this.engine.getProfile(user.id)) ?? { profile: await this.engine.recompute(user.id), version: 1 };
    return { profile: row.profile, version: row.version, summary: buildSelfReportData(row.profile) };
  }

  @Patch('me/soul-profile/layers')
  async editLayers(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const edits = parse(LAYER_EDITABLE, body);
    if (Object.keys(edits).length === 0) throw notFound('Nothing to update');
    return { profile: await this.engine.editLayers(user.id, edits as Record<string, string | string[]>) };
  }

  @Post('me/soul-profile/retake')
  async retake(@CurrentUser() user: AuthUser) {
    return { profile: await this.engine.retake(user.id) };
  }
}
