import { Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser, RequireGate, type AuthUser } from '../../common/auth';
import { localeFrom } from '../engine/engine.controller';
import { AdsService } from './ads.service';

@Controller('v1/ads')
@RequireGate('active')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Headers('accept-language') lang?: string) {
    return this.ads.forViewer(user.id, localeFrom(lang));
  }

  @Post(':id/impression')
  @HttpCode(204)
  async impression(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.ads.count(id, 'impression');
  }

  @Post(':id/click')
  @HttpCode(204)
  async click(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.ads.count(id, 'click');
  }
}
