import { AnalyticsService } from '../analytics/analytics.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { notFound } from '../../common/errors';
import { familyIds } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import { pair } from '../matches/likes.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export const REPORT_CATEGORIES = ['harassment', 'scam', 'fake_profile', 'underage', 'inappropriate_photos', 'threats', 'offline_behaviour', 'other'] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
const URGENT = new Set<ReportCategory>(['underage', 'threats']);
const AUTO_HIDE_REPORTERS = 3;

/** SAFE-001/002/003. */
@Injectable()
export class SafetyService {
  constructor(private readonly prisma: PrismaService, private readonly limiter: RateLimiter, private readonly rt: RealtimeGateway, private readonly analytics: AnalyticsService) {}

  /** Instant, permanent, both directions. The blocked user is not notified. */
  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw notFound();
    const target = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) throw notFound();
    try {
      await this.prisma.block.create({ data: { blockerId, blockedId } });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
    }
    this.analytics.track(blockerId, 'block_created');
    // CR-17: the blocked person can't keep talking through another of their profiles.
    for (const otherId of await familyIds(this.prisma, blockedId)) await this.endMatch(blockerId, otherId);
  }

  private async endMatch(blockerId: string, blockedId: string) {
    const match = await this.prisma.match.findUnique({ where: { userLow_userHigh: pair(blockerId, blockedId) } });
    if (match && !match.endedAt) {
      await this.prisma.$transaction([
        this.prisma.match.update({ where: { id: match.id }, data: { endedAt: new Date(), endedBy: blockerId, endReason: 'block' } }),
        this.prisma.message.updateMany({ where: { matchId: match.id, hiddenAt: null }, data: { hiddenAt: new Date() } }),
        this.prisma.report.deleteMany({ where: { matchId: match.id } }),
      ]);
      for (const id of [blockerId, blockedId]) this.rt.emit(id, 'match.ended', { matchId: match.id });
    }
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }

  async listBlocks(blockerId: string) {
    const rows = await this.prisma.block.findMany({ where: { blockerId }, orderBy: { createdAt: 'desc' } });
    const profiles = await this.prisma.profile.findMany({ where: { userId: { in: rows.map((r) => r.blockedId) } }, select: { userId: true, firstName: true } });
    const names = new Map(profiles.map((p) => [p.userId, p.firstName]));
    return rows.map((r) => ({ userId: r.blockedId, firstName: names.get(r.blockedId) ?? null, since: r.createdAt }));
  }

  async report(reporterId: string, input: { userId: string; category: ReportCategory; comment?: string; matchId?: string; alsoBlock?: boolean }) {
    this.limiter.check(`report:${reporterId}`, 10, 86_400_000);
    if (input.userId === reporterId) throw notFound();
    const target = await this.prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
    if (!target) throw notFound();
    const report = await this.prisma.moderationReport.create({
      data: {
        reporterId,
        reportedId: input.userId,
        matchId: input.matchId,
        category: input.category,
        comment: input.comment,
        urgent: URGENT.has(input.category),
      },
    });
    this.analytics.track(reporterId, 'report_submitted', { category: input.category });
    if (input.alsoBlock !== false) await this.block(reporterId, input.userId);
    await this.autoHide(input.userId);
    return { id: report.id, status: report.status };
  }

  /** SAFE-003: ≥ 3 distinct reporters in 7 days → hidden from discovery pending review (not banned). */
  private async autoHide(userId: string) {
    const since = new Date(Date.now() - 7 * 86_400_000);
    const reporters = await this.prisma.moderationReport.findMany({ where: { reportedId: userId, createdAt: { gte: since } }, distinct: ['reporterId'], select: { reporterId: true } });
    if (reporters.length >= AUTO_HIDE_REPORTERS) {
      await this.prisma.user.update({ where: { id: userId }, data: { hiddenByModeration: true } });
      await this.prisma.auditEvent.create({ data: { actorType: 'system', action: 'auto_hidden', targetType: 'user', targetId: userId, metadata: { reporters: reporters.length } } });
    }
  }
}
