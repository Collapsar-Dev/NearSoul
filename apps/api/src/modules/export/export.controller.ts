import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../../common/auth';
import { ExportService } from './export.service';

@Controller('v1/me/export')
export class ExportController {
  constructor(private readonly exports: ExportService) {}

  @Post()
  @HttpCode(202)
  request(@CurrentUser() user: AuthUser) {
    return this.exports.request(user.id);
  }

  @Get()
  latest(@CurrentUser() user: AuthUser) {
    return this.exports.latest(user.id);
  }
}
