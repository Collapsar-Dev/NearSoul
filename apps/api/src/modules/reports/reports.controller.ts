import { AnalyticsService } from '../analytics/analytics.service';
import { Controller, Get, Headers, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { localeFrom } from '../engine/engine.controller';
import { ReportsService } from './reports.service';

@Controller('v1')
export class ReportsController {
  constructor(private readonly reports: ReportsService, private readonly analytics: AnalyticsService) {}

  @Get('reports/self')
  @RequireGate('age')
  self(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    this.analytics.track(user.id, 'self_report_viewed');
    return this.reports.self(user.id, localeFrom(lang));
  }

  @Get('matches/:id/report')
  @RequireGate('active')
  pair(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('accept-language') lang?: string) {
    this.analytics.track(user.id, 'pair_report_viewed');
    return this.reports.pair(user.id, id, localeFrom(lang));
  }
}
