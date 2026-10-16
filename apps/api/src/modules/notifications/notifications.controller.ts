import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '../../common/auth';
import { badRequest } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { parse } from '../../common/zod';
import { NotificationsService } from './notifications.service';
import { parseWebPushSubscription, PushService } from './push.service';

@Controller('v1')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService, private readonly prisma: PrismaService, private readonly push: PushService) {}

  /** What the client needs to subscribe: the VAPID public key for Web Push, and whether native push is live. */
  @Get('push/config')
  async pushConfig() {
    const vapid = await this.push.vapidKeys();
    return { webPushPublicKey: vapid.publicKey, fcmEnabled: this.push.fcmEnabled() };
  }

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
    let stored = token;
    if (platform === 'web') {
      const sub = parseWebPushSubscription(token);
      if (!sub) throw badRequest('INVALID_PUSH_SUBSCRIPTION', 'Unsupported Web Push subscription.');
      stored = JSON.stringify(sub);
      // One browser subscription per session: a re-subscribe replaces the old one.
      await this.prisma.deviceToken.deleteMany({ where: { sessionId: user.sessionId, platform: 'web', NOT: { token: stored } } });
    }
    await this.prisma.deviceToken.upsert({
      where: { sessionId_token: { sessionId: user.sessionId, token: stored } },
      create: { sessionId: user.sessionId, token: stored, platform },
      update: {},
    });
  }

  @Delete('devices')
  @HttpCode(204)
  async removeDevices(@CurrentUser() user: AuthUser) {
    await this.prisma.deviceToken.deleteMany({ where: { sessionId: user.sessionId } });
  }
}
