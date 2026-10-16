import { AnalyticsService } from '../analytics/analytics.service';
import { Injectable } from '@nestjs/common';
import { env } from '../../config/env';
import { badRequest, forbidden } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { SoulCryptoService } from '../soul/soul-crypto.service';

export function ageOn(dob: Date, now: Date): number {
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export const OPTIONAL_CONSENTS = ['product_emails', 'analytics', 'ai_writing', 'ai_self_discovery'] as const;

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService, private readonly soulCrypto: SoulCryptoService, private readonly analytics: AnalyticsService) {}

  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: { include: { interests: true } }, photos: { where: { status: 'ready' } }, soulProfile: { select: { archetype: true } }, card: { select: { reviewed: true } } },
    });
    const consents = await this.latestConsents(userId);
    return {
      id: u.id,
      email: u.email,
      status: u.status,
      role: u.role,
      locale: u.locale,
      age: u.dob ? ageOn(u.dob, new Date()) : null,
      ageGatePassed: !!u.ageGatePassedAt,
      settings: {
        discoveryEnabled: u.discoveryEnabled,
        hideDistance: u.hideDistance,
        readReceipts: u.readReceipts,
        cardVisibility: u.cardVisibility,
        shareLevel: u.shareLevel,
        flexibleFallback: u.flexibleFallback,
      },
      consents,
      invitesLeft: u.invitesLeft,
      archetype: u.soulProfile?.archetype ?? null,
      onboarding: {
        dob: !!u.dob,
        terms: consents.terms === true,
        quickScan: await this.quickScanComplete(userId),
        cardReviewed: !!u.card?.reviewed,
        shareLevel: !!u.shareLevel,
        basics: !!u.profile,
        photos: u.photos.length >= 2,
        interests: (u.profile?.interests.length ?? 0) >= 3,
        complete: u.status === 'active',
      },
      environment: env().APP_ENV,
      paywallEnabled: env().PAYWALL_ENABLED,
      soulTalkEnabled: env().SOUL_TALK_ENABLED,
      soulKeepConversations: u.soulKeepConversations,
    };
  }

  private async quickScanComplete(userId: string) {
    const row = await this.prisma.soulProfileRow.findUnique({ where: { userId }, select: { profile: true } });
    return !!(row?.profile as { quickScanComplete?: boolean } | undefined)?.quickScanComplete;
  }

  async latestConsents(userId: string): Promise<Record<string, boolean | string>> {
    const rows = await this.prisma.consent.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    const out: Record<string, boolean | string> = {};
    for (const r of rows) {
      if (r.type === 'terms' && r.version !== env().TERMS_VERSION) continue;
      out[r.type] = r.granted;
    }
    return out;
  }

  /** ONB-001: server computes age. Under 18 → blocked; DOB can only be set once. */
  async setDob(userId: string, dobIso: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.dob) throw forbidden('DOB_LOCKED', 'Your date of birth can only be changed by support.');
    const dob = new Date(`${dobIso}T00:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) throw badRequest('INVALID_DATE', 'Please enter a valid date.');
    const age = ageOn(dob, new Date());
    if (age > 120 || age < 0) throw badRequest('INVALID_DATE', 'Please enter a valid date.');
    if (age < 18) {
      await this.prisma.user.update({ where: { id: userId }, data: { dob, status: 'blocked_underage' } });
      await this.prisma.auditEvent.create({ data: { actorType: 'system', action: 'underage_blocked', targetType: 'user', targetId: userId } });
      return { allowed: false };
    }
    await this.prisma.user.update({ where: { id: userId }, data: { dob, ageGatePassedAt: new Date(), onboardingStep: 'consents' } });
    this.analytics.track(userId, 'age_gate_passed');
    return { allowed: true, age };
  }

  async setConsents(userId: string, input: { terms?: boolean; alphaTerms?: boolean; optional?: Partial<Record<(typeof OPTIONAL_CONSENTS)[number], boolean>> }) {
    const rows: { userId: string; type: string; version: string; granted: boolean }[] = [];
    if (input.terms !== undefined) rows.push({ userId, type: 'terms', version: env().TERMS_VERSION, granted: input.terms });
    if (input.alphaTerms !== undefined) rows.push({ userId, type: 'alpha_terms', version: env().TERMS_VERSION, granted: input.alphaTerms });
    for (const [type, granted] of Object.entries(input.optional ?? {})) rows.push({ userId, type, version: '1', granted: !!granted });
    if (env().APP_ENV === 'alpha' && input.terms === true && input.alphaTerms !== true) {
      throw badRequest('ALPHA_TERMS_REQUIRED', 'Please accept the test-version terms.');
    }
    if (rows.length) await this.prisma.consent.createMany({ data: rows });
    for (const r of rows.filter((x) => x.granted)) this.analytics.track(userId, 'consent_given', { category: r.type });
    return this.latestConsents(userId);
  }

  async setShareLevel(userId: string, level: 'minimal' | 'standard' | 'deep') {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { shareLevel: level } }),
      this.prisma.consent.create({ data: { userId, type: 'pair_report_share', version: '1', value: { level }, granted: true } }),
      // Cached pair reports involving this user must be regenerated (RPT-003).
      this.prisma.report.deleteMany({ where: { type: 'pair', OR: [{ ownerId: userId }, { otherId: userId }] } }),
    ]);
    this.analytics.track(userId, 'share_level_set', { level });
  }

  async updateSettings(userId: string, data: Partial<{ discoveryEnabled: boolean; hideDistance: boolean; readReceipts: boolean; cardVisibility: 'everyone' | 'matches_only' | 'hidden'; flexibleFallback: boolean; locale: 'en' | 'ru'; timezone: string }>) {
    await this.prisma.user.update({ where: { id: userId }, data });
    if (data.discoveryEnabled !== undefined) this.analytics.track(userId, data.discoveryEnabled ? 'discovery_enabled' : 'discovery_disabled');
    if (data.discoveryEnabled === false) {
      // GEO-001: turning discovery off deletes the stored location.
      await this.prisma.userLocation.deleteMany({ where: { userId } });
    }
  }

  /** Marks onboarding complete once every requirement is met (status → active). */
  async completeOnboarding(userId: string) {
    const me = await this.me(userId);
    const o = me.onboarding;
    const missing = Object.entries({ dob: o.dob, terms: o.terms, quickScan: o.quickScan, shareLevel: o.shareLevel, basics: o.basics, photos: o.photos, interests: o.interests })
      .filter(([, ok]) => !ok)
      .map(([k]) => k);
    if (missing.length) throw badRequest('ONBOARDING_INCOMPLETE', 'A few steps are still missing.', { missing });
    await this.prisma.user.update({ where: { id: userId }, data: { status: 'active', onboardingStep: 'done' } });
    this.analytics.track(userId, 'profile_completed');
    return { status: 'active' };
  }

  /** ACC-003: immediately invisible + signed out; the deletion job removes the data. */
  async requestDeletion(userId: string) {
    // SOUL-007: crypto-shred Soul Talk data before anything else.
    this.analytics.track(userId, 'account_deletion_requested');
    await this.soulCrypto.destroy(userId);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: 'deletion_requested', deletionRequestedAt: new Date(), discoveryEnabled: false } }),
      this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.userLocation.deleteMany({ where: { userId } }),
      this.prisma.nearbySession.updateMany({ where: { userId, endedAt: null }, data: { endedAt: new Date() } }),
    ]);
  }
}
