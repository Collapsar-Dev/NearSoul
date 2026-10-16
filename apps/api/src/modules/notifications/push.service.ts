import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface PushMessage {
  title: string;
  body: string;
  data: Record<string, string>;
}

/**
 * Push channel (D8/D36). Generic texts only: no names or message bodies on the lock screen (NOTIF-001).
 * FCM delivery is enabled once a service account is configured (M5/M9). Until then pushes are skipped and
 * the in-app notification centre remains the source of truth.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger('Push');

  constructor(private readonly prisma: PrismaService) {}

  async send(userId: string, msg: PushMessage): Promise<number> {
    const tokens = await this.prisma.deviceToken.findMany({ where: { session: { userId, revokedAt: null } } });
    if (!tokens.length || !process.env.FCM_SERVICE_ACCOUNT_JSON) return 0;
    // FCM HTTP v1 integration lands with milestone M5 (requires a Firebase project from the founder).
    this.logger.debug({ msg: 'push skipped: FCM not wired yet', type: msg.data.type, tokens: tokens.length });
    return 0;
  }
}
