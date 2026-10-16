import { Controller, Get, Headers, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { localeFrom } from '../engine/engine.controller';
import { ReportsService } from './reports.service';

@Controller('v1')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('reports/self')
  @RequireGate('age')
  self(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    return this.reports.self(user.id, localeFrom(lang));
  }

  @Get('matches/:id/report')
  @RequireGate('active')
  pair(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('accept-language') lang?: string) {
    return this.reports.pair(user.id, id, localeFrom(lang));
  }
}
