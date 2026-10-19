import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AppError, badRequest, notFound } from '../../common/errors';
import { familyIds } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';
import { env } from '../../config/env';
import { ARCHETYPES, codeText, tr, type L, type Locale } from '../../content/texts';
import { EngineService } from '../engine/engine.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { SubjectsService } from './subjects.service';

export const CHECKS_PER_DAY = 20;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/**
 * CR-31 "Check our compatibility": the owner shares a personal link; anyone who has done the 10 starter questions
 * can open it and see one rounded percent + the top reasons, framed for any kind of relationship (friends, a crush).
 * It never creates a match or a chat, never shows answers or trait scores, and both people see the same result.
 */
@Injectable()
export class SoulCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subjects: SubjectsService,
    private readonly engine: EngineService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async myLink(userId: string) {
    let link = await this.prisma.soulLink.findUnique({ where: { userId } });
    while (!link) {
      const code = Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join('');
      link = await this.prisma.soulLink.create({ data: { code, userId } }).catch(() => null);
    }
    return { code: link.code, url: `${env().APP_PUBLIC_URL.replace(/\/$/, '')}/c/${link.code}` };
  }

  private async owner(code: string, viewerId: string) {
    if (!/^[a-z0-9]{6,12}$/.test(code)) throw notFound();
    const link = await this.prisma.soulLink.findUnique({ where: { code } });
    if (!link) throw notFound();
    const owner = await this.prisma.user.findUnique({
      where: { id: link.userId },
      include: { profile: true, soulProfile: { select: { archetype: true } }, photos: { where: { status: 'ready' }, orderBy: { position: 'asc' }, take: 1 } },
    });
    if (!owner || owner.status !== 'active' || owner.hiddenByModeration) throw notFound();
    const blocked = await this.prisma.block.findFirst({ where: { OR: [{ blockerId: owner.id, blockedId: viewerId }, { blockerId: viewerId, blockedId: owner.id }] } });
    if (blocked) throw notFound();
    return owner;
  }

  async preview(code: string, viewerId: string, locale: Locale) {
    const o = await this.owner(code, viewerId);
    const archetype = o.soulProfile?.archetype ?? 'harmonizer';
    return {
      firstName: o.profile?.firstName ?? '',
      photo: o.photos[0] ? await this.storage.signedUrl(o.photos[0].storageKey) : null,
      archetype: { key: archetype, name: tr(ARCHETYPES[archetype as keyof typeof ARCHETYPES].name, locale) },
      isMe: o.id === viewerId,
      existing: await this.prisma.soulCheck.findUnique({ where: { ownerId_viewerId: { ownerId: o.id, viewerId } }, select: { percent: true } }),
    };
  }

  async check(code: string, viewerId: string, locale: Locale) {
    const o = await this.owner(code, viewerId);
    if (o.id === viewerId || (await familyIds(this.prisma, viewerId)).includes(o.id)) throw badRequest('OWN_LINK', 'This is your own link: share it with friends.');
    const today = await this.prisma.soulCheck.count({ where: { viewerId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
    const subjects = await this.subjects.load([o.id, viewerId]);
    const a = subjects.get(viewerId);
    const b = subjects.get(o.id);
    if (!a?.profile?.quickScanComplete) throw badRequest('NEEDS_ANSWERS', 'Answer the 10 starter questions first.');
    if (!b?.profile) throw notFound();
    const existing = await this.prisma.soulCheck.findUnique({ where: { ownerId_viewerId: { ownerId: o.id, viewerId } } });
    if (!existing && today >= CHECKS_PER_DAY) throw new AppError(429, 'CHECK_LIMIT', `You can check ${CHECKS_PER_DAY} links a day.`, { limit: CHECKS_PER_DAY });
    // Any kind of relationship: dating intent must not lower a friendship check.
    const c = this.subjects.compat(a, { ...b, intent: a.intent }, await this.engine.matchConfig());
    if (!c) throw notFound();
    const percent = Math.round(c.score / 5) * 5;
    const labels = Object.fromEntries((await this.prisma.interest.findMany()).map((r) => [r.id, r.labels as unknown as L]));
    // Varied reasons: one per kind first (not three "shared value" lines), then the rest.
    const pool = c.reasons.filter((r) => r !== 'SAME_INTENT');
    const firstOfKind = pool.filter((r, i) => pool.findIndex((x) => x.split(':')[0] === r.split(':')[0]) === i);
    const ordered = [...firstOfKind, ...pool.filter((r) => !firstOfKind.includes(r))];
    const reasons = ordered.slice(0, 3).map((r) => codeText(r, locale, { interests: labels }));
    await this.prisma.soulCheck.upsert({ where: { ownerId_viewerId: { ownerId: o.id, viewerId } }, create: { ownerId: o.id, viewerId, percent }, update: { percent } });
    if (!existing) await this.notifications.notify(o.id, 'soul_check', { percent: String(percent) });
    const name = (k: string) => tr(ARCHETYPES[k as keyof typeof ARCHETYPES].name, locale);
    return {
      percent,
      tier: c.tier,
      reasons,
      moreReasons: Math.max(0, pool.length - reasons.length),
      you: { archetype: name(a.profile.archetype) },
      them: { firstName: o.profile?.firstName ?? '', archetype: name(b.profile.archetype) },
    };
  }

  /** People who checked with my link, and links I checked. Only names, photos and the percent. */
  async list(userId: string) {
    const rows = await this.prisma.soulCheck.findMany({
      where: { OR: [{ ownerId: userId }, { viewerId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const otherIds = rows.map((r) => (r.ownerId === userId ? r.viewerId : r.ownerId));
    const users = await this.prisma.user.findMany({
      where: { id: { in: otherIds }, status: { in: ['active', 'onboarding'] }, hiddenByModeration: false },
      include: { profile: { select: { firstName: true } }, photos: { where: { status: 'ready' }, orderBy: { position: 'asc' }, take: 1 } },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const out = [];
    for (const r of rows) {
      const otherId = r.ownerId === userId ? r.viewerId : r.ownerId;
      const u = byId.get(otherId);
      if (!u) continue;
      out.push({ firstName: u.profile?.firstName ?? '', photo: u.photos[0] ? await this.storage.signedUrl(u.photos[0].storageKey) : null, percent: r.percent, theyChecked: r.ownerId === userId, createdAt: r.createdAt });
    }
    return { items: out };
  }
}
