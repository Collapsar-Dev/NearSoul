import { Injectable } from '@nestjs/common';
import { notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { BillingService } from '../billing/billing.service';

type Localized = { en: string; ru: string };
const pick = (v: unknown, locale: 'en' | 'ru') => (v as Localized)[locale] ?? (v as Localized).en;

/**
 * Sponsored cards (CR-25). Contextual only: every free/Soul+ viewer gets the same active cards, nothing is chosen
 * from personal data, and only aggregate impression/click counts are kept. Gold and VIP have no ads.
 */
@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService, private readonly billing: BillingService) {}

  async forViewer(userId: string, locale: 'en' | 'ru') {
    if (!(await this.billing.features(userId)).showAds) return { ads: [], every: 10 };
    const rows = await this.prisma.adCard.findMany({ where: { active: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 10 });
    return {
      every: 10,
      ads: rows.map((a) => ({
        id: a.id,
        title: pick(a.title, locale),
        body: pick(a.body, locale),
        cta: pick(a.cta, locale),
        url: a.url,
        color: a.color,
        sponsor: a.sponsor,
        isTest: a.isTest,
        locations: a.locations,
      })),
    };
  }

  async count(adId: string, kind: 'impression' | 'click') {
    const res = await this.prisma.adCard.updateMany({ where: { id: adId, active: true }, data: kind === 'click' ? { clicks: { increment: 1 } } : { impressions: { increment: 1 } } });
    if (!res.count) throw notFound('Ad not found');
  }
}
