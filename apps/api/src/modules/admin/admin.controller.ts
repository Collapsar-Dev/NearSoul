import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { Public } from '../../common/auth';
import { badRequest, notFound } from '../../common/errors';
import { familyIds } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';
import { parse } from '../../common/zod';
import { env } from '../../config/env';
import { InvitesService } from '../invites/invites.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { StorageService } from '../storage/storage.service';
import { VerificationService } from '../profile/verification.service';
import { AdminAuthService, AdminGuard, AdminRoles, CurrentAdmin, type AdminPrincipal } from './admin.auth';

const ACTIONS = ['dismiss', 'warn', 'hide', 'restore', 'remove_photo', 'suspend'] as const;
const ROLE_FOR: Record<(typeof ACTIONS)[number], ('moderator' | 'support' | 'admin')[]> = {
  dismiss: ['moderator'], warn: ['moderator'], hide: ['moderator'], restore: ['moderator'], remove_photo: ['moderator'], suspend: [],
};

/**
 * SAFE-004 / §15. Never exposes Soul Talk, raw engine answers, scores or reports content to any admin role.
 */
@Controller('admin/v1')
@Public()
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AdminAuthService,
    private readonly invites: InvitesService,
    private readonly storage: StorageService,
    private readonly rt: RealtimeGateway,
    private readonly verification: VerificationService,
  ) {}

  private audit(admin: AdminPrincipal, action: string, targetType: string, targetId: string, metadata?: Record<string, string>) {
    return this.prisma.auditEvent.create({ data: { actorType: 'admin', actorId: admin.id, action, targetType, targetId, metadata } });
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown, @Req() req: Request) {
    const { email, password, totp } = parse(z.object({ email: z.string().email(), password: z.string().min(8).max(200), totp: z.string().regex(/^\d{6}$/) }).strict(), body);
    return this.auth.login(email, password, totp, req.ip ?? 'unknown');
  }

  @Get('me')
  @AdminRoles('moderator', 'support')
  me(@CurrentAdmin() admin: AdminPrincipal) {
    return admin;
  }

  /** CR-30: pending selfie checks with the profile photos to compare against. */
  @Get('verifications')
  @AdminRoles('moderator')
  verifications() {
    return this.verification.queue();
  }

  @Post('verifications/:id/decide')
  @HttpCode(200)
  @AdminRoles('moderator')
  async decideVerification(@CurrentAdmin() admin: AdminPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const { approve, reason } = parse(z.object({ approve: z.boolean(), reason: z.enum(['not_matching', 'pose_missing', 'unclear', 'not_a_person']).optional() }).strict(), body);
    const r = await this.verification.decide(id, approve, admin.id, reason);
    await this.audit(admin, approve ? 'verification_approved' : 'verification_rejected', 'photo_verification', id);
    return r;
  }

  @Get('queue')
  @AdminRoles('moderator')
  async queue(@Query('status') status = 'open') {
    const rows = await this.prisma.moderationReport.findMany({
      where: { status: status === 'all' ? undefined : status },
      orderBy: [{ urgent: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    });
    return rows.map((r) => ({ id: r.id, category: r.category, urgent: r.urgent, status: r.status, reportedId: r.reportedId, createdAt: r.createdAt, hasChat: !!r.matchId }));
  }

  @Get('cases/:id')
  @AdminRoles('moderator')
  async case(@CurrentAdmin() admin: AdminPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    const r = await this.prisma.moderationReport.findUnique({ where: { id } });
    if (!r) throw notFound();
    const reported = await this.prisma.user.findUnique({
      where: { id: r.reportedId },
      include: { profile: true, photos: { where: { status: 'ready' }, orderBy: { position: 'asc' } } },
    });
    let messages: { from: 'reporter' | 'reported'; body: string; at: Date }[] = [];
    if (r.matchId) {
      // Only for chat-linked reports; access is audited with the reason.
      await this.audit(admin, 'case_chat_viewed', 'report', r.id);
      const rows = await this.prisma.message.findMany({ where: { matchId: r.matchId }, orderBy: { createdAt: 'desc' }, take: 50 });
      messages = rows.reverse().map((m) => ({ from: m.senderId === r.reporterId ? 'reporter' : 'reported', body: m.body, at: m.createdAt }));
    }
    const priorReports = await this.prisma.moderationReport.count({ where: { reportedId: r.reportedId } });
    return {
      report: { id: r.id, category: r.category, comment: r.comment, urgent: r.urgent, status: r.status, createdAt: r.createdAt, resolution: r.resolution },
      reported: reported && {
        id: reported.id, status: reported.status, hidden: reported.hiddenByModeration, createdAt: reported.createdAt,
        firstName: reported.profile?.firstName, bio: reported.profile?.bio,
        photos: await Promise.all(reported.photos.map(async (p) => ({ id: p.id, url: await this.storage.signedUrl(p.storageKey) }))),
        priorReports,
      },
      messages,
    };
  }

  @Post('cases/:id/assign')
  @AdminRoles('moderator')
  @HttpCode(204)
  async assign(@CurrentAdmin() admin: AdminPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    await this.prisma.moderationReport.update({ where: { id }, data: { assignedTo: admin.id, status: 'in_review' } });
    await this.audit(admin, 'case_assigned', 'report', id);
  }

  @Post('cases/:id/resolve')
  @AdminRoles('moderator')
  @HttpCode(200)
  async resolve(@CurrentAdmin() admin: AdminPrincipal, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const input = parse(z.object({ action: z.enum(ACTIONS), reason: z.string().trim().min(3).max(500), photoId: z.string().uuid().optional() }).strict(), body);
    if (admin.role !== 'admin' && !ROLE_FOR[input.action].includes(admin.role)) throw badRequest('ROLE', 'Only admins can suspend accounts.');
    const r = await this.prisma.moderationReport.findUnique({ where: { id } });
    if (!r) throw notFound();
    await this.applyAction(admin, r.reportedId, input.action, input.reason, r.id, input.photoId);
    await this.prisma.moderationReport.update({ where: { id }, data: { status: input.action === 'dismiss' ? 'dismissed' : 'actioned', resolution: input.action, resolvedAt: new Date() } });
    return { status: 'resolved' };
  }

  @Post('users/:id/actions')
  @AdminRoles('moderator')
  @HttpCode(200)
  async userAction(@CurrentAdmin() admin: AdminPrincipal, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const input = parse(z.object({ action: z.enum(ACTIONS), reason: z.string().trim().min(3).max(500), photoId: z.string().uuid().optional() }).strict(), body);
    if (admin.role !== 'admin' && !ROLE_FOR[input.action].includes(admin.role)) throw badRequest('ROLE', 'Only admins can suspend accounts.');
    await this.applyAction(admin, id, input.action, input.reason, undefined, input.photoId);
    return { status: 'done' };
  }

  private async applyAction(admin: AdminPrincipal, userId: string, action: (typeof ACTIONS)[number], reason: string, reportId?: string, photoId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound();
    if (action === 'hide') await this.prisma.user.update({ where: { id: userId }, data: { hiddenByModeration: true } });
    if (action === 'restore') {
      const family = await familyIds(this.prisma, userId);
      await this.prisma.user.update({ where: { id: userId }, data: { hiddenByModeration: false } });
      if (user.status === 'suspended') await this.prisma.user.updateMany({ where: { id: { in: family }, status: 'suspended' }, data: { status: 'active', hiddenByModeration: false } });
    }
    if (action === 'remove_photo') {
      const photo = await this.prisma.photo.findFirst({ where: { id: photoId, userId } });
      if (!photo) throw badRequest('PHOTO', 'Choose a photo to remove.');
      await this.prisma.photo.delete({ where: { id: photo.id } });
      await this.storage.delete(photo.storageKey);
      if (photo.sha256) await this.prisma.auditEvent.create({ data: { actorType: 'admin', actorId: admin.id, action: 'photo_hash_banned', targetType: 'photo_hash', targetId: photo.sha256 } });
    }
    if (action === 'suspend') {
      // A suspension covers every profile of the person (CR-17 personas).
      const family = await familyIds(this.prisma, userId);
      const photos = await this.prisma.photo.findMany({ where: { userId: { in: family } } });
      await this.prisma.$transaction([
        this.prisma.user.updateMany({ where: { id: { in: family } }, data: { status: 'suspended', hiddenByModeration: true } }),
        this.prisma.session.updateMany({ where: { userId: { in: family }, revokedAt: null }, data: { revokedAt: new Date() } }),
        ...photos.filter((p) => p.sha256).map((p) => this.prisma.auditEvent.create({ data: { actorType: 'admin', actorId: admin.id, action: 'photo_hash_banned', targetType: 'photo_hash', targetId: p.sha256! } })),
      ]);
      for (const id of family) this.rt.disconnectUser(id);
    }
    await this.prisma.moderationAction.create({ data: { adminId: admin.id, targetUserId: userId, action, reason, reportId } });
    await this.audit(admin, `moderation_${action}`, 'user', userId);
  }

  @Get('users/:id')
  @AdminRoles('support', 'moderator')
  async user(@CurrentAdmin() admin: AdminPrincipal, @Param('id', new ParseUUIDPipe()) id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, include: { profile: { select: { firstName: true } } } });
    if (!u) throw notFound();
    await this.audit(admin, 'user_viewed', 'user', id);
    // Other profiles of the same person (CR-17), so moderation sees the whole picture.
    const linkedProfiles = (await familyIds(this.prisma, u.id)).filter((x) => x !== u.id);
    return { id: u.id, email: u.email ?? (u.parentId ? (await this.prisma.user.findUnique({ where: { id: u.parentId }, select: { email: true } }))?.email : null), status: u.status, role: u.role, hidden: u.hiddenByModeration, createdAt: u.createdAt, lastActiveAt: u.lastActiveAt, firstName: u.profile?.firstName ?? null, deletionRequestedAt: u.deletionRequestedAt, isPersona: u.parentId !== null, linkedProfiles };
  }

  @Get('users')
  @AdminRoles('support', 'moderator')
  async findUser(@CurrentAdmin() admin: AdminPrincipal, @Query('email') email?: string) {
    if (!email) throw badRequest('EMAIL', 'Provide an email.');
    const u = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
    if (!u) throw notFound();
    return this.user(admin, u.id);
  }

  @Get('invites')
  @AdminRoles('admin')
  async listInvites() {
    const rows = await this.prisma.invite.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.map((i) => ({ code: i.code, uses: i.uses, maxUses: i.maxUses, byAdmin: i.createdByAdmin, expiresAt: i.expiresAt, createdAt: i.createdAt }));
  }

  @Post('invites')
  @AdminRoles('admin')
  async createInvites(@CurrentAdmin() admin: AdminPrincipal, @Body() body: unknown) {
    const { count, maxUses, expiresInDays } = parse(z.object({ count: z.number().int().min(1).max(100).default(1), maxUses: z.number().int().min(1).max(500).default(1), expiresInDays: z.number().int().min(1).max(365).optional() }).strict(), body);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000) : undefined;
    const codes: string[] = [];
    for (let i = 0; i < count; i++) codes.push(await this.invites.createByAdmin(maxUses, expiresAt));
    await this.audit(admin, 'invites_created', 'invite', String(count));
    return { codes, links: codes.map((c) => `${env().APP_PUBLIC_URL}/invite/${c}`) };
  }

  @Get('feedback')
  @AdminRoles('support', 'moderator')
  async feedback(@Query('status') status = 'new') {
    const rows = await this.prisma.feedback.findMany({ where: status === 'all' ? {} : { status }, orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.map((f) => ({ id: f.id, category: f.category, text: f.text, platform: f.platform, screen: f.screen, appVersion: f.appVersion, status: f.status, createdAt: f.createdAt }));
  }

  @Patch('feedback/:id')
  @AdminRoles('support', 'moderator')
  async triage(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const { status } = parse(z.object({ status: z.enum(['new', 'triaged', 'done']) }).strict(), body);
    await this.prisma.feedback.update({ where: { id }, data: { status } });
    return { status };
  }

  @Get('metrics')
  @AdminRoles('support', 'moderator')
  async metrics() {
    const [users, active, testers, matches, messages, openReports, urgent, feedback, ratings] = await Promise.all([
      this.prisma.user.count({ where: { isDemo: false } }),
      this.prisma.user.count({ where: { isDemo: false, status: 'active' } }),
      this.prisma.user.count({ where: { role: 'tester', isDemo: false } }),
      this.prisma.match.count(),
      this.prisma.message.count(),
      this.prisma.moderationReport.count({ where: { status: { in: ['open', 'in_review'] } } }),
      this.prisma.moderationReport.count({ where: { status: { in: ['open', 'in_review'] }, urgent: true } }),
      this.prisma.feedback.count({ where: { status: 'new' } }),
      this.prisma.rating.groupBy({ by: ['kind'], _avg: { stars: true }, _count: true }),
    ]);
    const archetypes = await this.prisma.soulProfileRow.groupBy({ by: ['archetype'], _count: true });
    return {
      users, active, testers, matches, messages, openReports, urgentReports: urgent, newFeedback: feedback,
      ratings: ratings.map((r) => ({ kind: r.kind, avg: r._avg.stars, count: r._count })),
      archetypes: archetypes.map((a) => ({ archetype: a.archetype, count: a._count })),
    };
  }

  @Get('audit')
  @AdminRoles('admin')
  async auditLog(@Query('target') target?: string) {
    return this.prisma.auditEvent.findMany({ where: target ? { targetId: target } : {}, orderBy: { createdAt: 'desc' }, take: 200 });
  }
}
