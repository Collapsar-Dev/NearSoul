import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';

/**
 * CHAT-002: authenticated socket per user. Clients receive events in their private room only.
 * Re-auth happens on every (re)connect via the handshake token.
 */
@WebSocketGateway({ path: '/ws', cors: { origin: (process.env.APP_ORIGINS ?? 'http://localhost:8080').split(','), credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger('Realtime');
  @WebSocketServer() server?: Server;

  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = String(client.handshake.auth?.token ?? '');
      const payload = await this.jwt.verifyAsync<{ sub: string; sid: string }>(token, { secret: env().JWT_SECRET });
      const session = await this.prisma.session.findUnique({ where: { id: payload.sid }, include: { user: { select: { status: true } } } });
      if (!session || session.revokedAt || ['deleted', 'deletion_requested', 'suspended'].includes(session.user.status)) throw new Error('revoked');
      await client.join(`user:${payload.sub}`);
      client.data.userId = payload.sub;
    } catch {
      client.emit('error', { code: 'UNAUTHENTICATED' });
      client.disconnect(true);
    }
  }

  emit(userId: string, event: string, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  /** Force-disconnect a user's sockets (block, suspension, deletion). */
  disconnectUser(userId: string): void {
    this.server?.in(`user:${userId}`).disconnectSockets(true);
    this.logger.debug(`disconnected user sockets`);
  }
}
