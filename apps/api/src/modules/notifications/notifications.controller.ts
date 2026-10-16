import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/auth';
import { PrismaService } from '../../common/prisma.service';
import { parse } from '../../common/zod';
import { NotificationsService } from './notifications.service';

@Controller('v1')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService, private readonly prisma: PrismaService) {}

  @Get('notifications')
  list(@CurrentUser() user: AuthUser, @Query('cursor') cursor?: string) {
    return this.notifications.list(user.id, cursor && !Number.isNaN(Date.parse(cursor)) ? cursor : undefined);
  }

  @Post('notifications/read-all')
  @HttpCode(204)
  async readAll(@CurrentUser() user: AuthUser) {
    await this.notifications.markRead(user.id);
  }

  @Post('notifications/:id/read')
  @HttpCode(204)
  async read(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.notifications.markRead(user.id, id);
  }

  /** Registers an FCM / Web Push token for the current session. */
  @Post('devices')
  @HttpCode(204)
  async device(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { token, platform } = parse(z.object({ token: z.string().min(10).max(4096), platform: z.enum(['web', 'android', 'ios', 'windows', 'macos', 'linux']) }).strict(), body);
    await this.prisma.deviceToken.upsert({
      where: { sessionId_token: { sessionId: user.sessionId, token } },
      create: { sessionId: user.sessionId, token, platform },
      update: {},
    });
  }

  @Delete('devices')
  @HttpCode(204)
  async removeDevices(@CurrentUser() user: AuthUser) {
    await this.prisma.deviceToken.deleteMany({ where: { sessionId: user.sessionId } });
  }
}
