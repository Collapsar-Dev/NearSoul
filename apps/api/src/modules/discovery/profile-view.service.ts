import { Injectable } from '@nestjs/common';
import { buildSelfReportData, DOMAINS, type CompatResult } from '../../engine';
import { ARCHETYPES, ARCHETYPE_DISCLAIMER, codeText, tr, type L, type Locale } from '../../content/texts';
import { PrismaService } from '../../common/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { Subject } from './subjects.service';

/**
 * Builds the public profile DTO (PROF-001 allowlist). Never includes email, DOB, coordinates, raw answers,
 * scores, traits or moderation flags. Contract-tested.
 */
@Injectable()
export class ProfileViewService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async interestLabels(): Promise<Record<string, L>> {
    const rows = await this.prisma.interest.findMany();
    return Object.fromEntries(rows.map((r) => [r.id, r.labels as unknown as L]));
  }

  async build(viewer: Subject, target: Subject, compat: CompatResult | null, locale: Locale, opts: { matched?: boolean; distanceBand?: string | null; activity?: string | null } = {}) {
    const [user, photos, labels] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: target.id }, include: { profile: { include: { city: true } }, card: true } }),
      this.prisma.photo.findMany({ where: { userId: target.id, status: 'ready' }, orderBy: { position: 'asc' } }),
      this.interestLabels(),
    ]);
    const p = user.profile!;
    const showCard = user.card && user.card.reviewed !== false && (user.cardVisibility === 'everyone' || (user.cardVisibility === 'matches_only' && opts.matched));
    const viewerInterests = new Set(viewer.interests);
    const archetype = target.profile?.archetype ?? 'harmonizer';
    const showDifference = compat && compat.confidence >= 0.6 && compat.frictions.length > 0;
    return {
      id: target.id,
      firstName: p.firstName,
      age: target.eligibility.age,
      photos: await Promise.all(photos.map(async (ph) => ({ id: ph.id, url: await this.storage.signedUrl(ph.storageKey) }))),
      bio: p.bio,
      intent: p.intent,
      heightCm: p.heightCm,
      jobTitle: p.jobTitle,
      city: p.city ? tr(p.city.name as unknown as L, locale) : null,
      distanceBand: opts.distanceBand ?? null,
      activity: opts.activity ?? null,
      interests: target.interests.map((id) => ({ id, label: labels[id] ? tr(labels[id]!, locale) : id, shared: viewerInterests.has(id) })),
      archetype: { key: archetype, name: tr(ARCHETYPES[archetype].name, locale), line: tr(ARCHETYPES[archetype].line, locale), disclaimer: tr(ARCHETYPE_DISCLAIMER, locale) },
      card: showCard
        ? { headline: user.card!.headline, summary: user.card!.summary, communicationStyle: user.card!.communicationStyle, idealFirstDate: user.card!.idealFirstDate, strengths: user.card!.strengths, aiWritten: user.card!.source === 'ai' }
        : null,
      compatibility: compat
        ? {
            tier: compat.tier,
            ...(process.env.SHOW_SCORE_PERCENT === 'true' ? { percent: Math.round(compat.score / 5) * 5 } : {}),
            reasons: compat.reasons.slice(0, 3).map((c) => codeText(c, locale, { interests: labels })),
            difference: showDifference ? codeText(compat.frictions[0]!, locale) : null,
          }
        : null,
      isDemo: target.isDemo,
    };
  }

  /** Owner's own Soul Profile presentation texts. */
  selfTexts(subject: Subject) {
    if (!subject.profile) return null;
    const self = buildSelfReportData(subject.profile);
    return { strengths: self.strengths, domains: DOMAINS.map((d) => ({ key: d, band: subject.profile!.domains[d].band })) };
  }
}
