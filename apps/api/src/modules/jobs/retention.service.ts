import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SoulService } from '../soul/soul.service';
import { ExportService } from '../export/export.service';

const MOD_RETENTION_DAYS = 90;

/** ACC-003 deletion job and retention purges (privacy-retention.md). Idempotent and retry-safe. */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger('Retention');

  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, private readonly rt: RealtimeGateway, private readonly soul: SoulService, private readonly exports: ExportService) {}

  async processDeletions(): Promise<number> {
    // Personas first: deleting an owner row would cascade to its personas before their photos and data are cleaned up.
    const users = await this.prisma.user.findMany({ where: { status: 'deletion_requested' }, select: { id: true }, orderBy: { parentId: { sort: 'asc', nulls: 'last' } }, take: 50 });
    for (const { id } of users) {
      this.rt.disconnectUser(id);
      const photos = await this.prisma.photo.findMany({ where: { userId: id } });
      for (const p of photos) await this.storage.delete(p.storageKey);
      const exportsToDelete = await this.prisma.dataExportJob.findMany({ where: { userId: id } });
      for (const e of exportsToDelete) if (e.storageKey) await this.storage.delete(e.storageKey);
      await this.prisma.dataExportJob.deleteMany({ where: { userId: id } });
      await this.prisma.match.updateMany({ where: { endedAt: null, OR: [{ userLow: id }, { userHigh: id }] }, data: { endedAt: new Date(), endedBy: id, endReason: 'deletion' } });
      await this.prisma.report.deleteMany({ where: { OR: [{ ownerId: id }, { otherId: id }] } });
      await this.prisma.dailySet.deleteMany({ where: { userId: id } });
      await this.prisma.nearbySession.deleteMany({ where: { userId: id } });
      await this.prisma.nearbyLater.deleteMany({ where: { OR: [{ userId: id }, { targetId: id }] } });
      await this.prisma.inviteRedemption.deleteMany({ where: { userId: id } });
      await this.prisma.user.delete({ where: { id } }); // cascades profile, answers, soul profile, card, photos rows, sessions, consents, likes…
      await this.prisma.auditEvent.create({ data: { actorType: 'system', action: 'account_deleted', targetType: 'user', targetId: id } });
    }
    return users.length;
  }

  async purge(now = new Date()): Promise<void> {
    const cutoff = new Date(now.getTime() - MOD_RETENTION_DAYS * 86_400_000);
    const openCaseMatches = (await this.prisma.moderationReport.findMany({ where: { status: { in: ['open', 'in_review'] }, matchId: { not: null } }, select: { matchId: true } })).map((r) => r.matchId!);
    await this.prisma.message.deleteMany({ where: { hiddenAt: { lt: cutoff }, matchId: { notIn: openCaseMatches } } });
    await this.prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } });
    await this.prisma.authCode.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 86_400_000) } } });
    await this.prisma.session.deleteMany({ where: { revokedAt: { lt: new Date(now.getTime() - 30 * 86_400_000) } } });
    await this.soul.purge(now);
    await this.exports.cleanup(now);
  }

  @Interval(10 * 60_000)
  async tick() {
    if (env().APP_ENV === 'test') return;
    try {
      const n = await this.processDeletions();
      await this.purge();
      if (n) this.logger.log({ msg: 'deletions processed', count: n });
    } catch (e) {
      this.logger.error({ msg: 'retention failed', err: (e as Error).message });
    }
  }
}
