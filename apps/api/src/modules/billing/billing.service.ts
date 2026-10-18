import { Injectable, Logger } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/errors';
import { accountRootId, familyIds } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';

export const SOUL_PLUS = 'soul_plus';

/** Subscription levels (CR-18). Each level includes everything below it. */
export type Tier = 'free' | 'plus' | 'gold' | 'vip';
export const TIER_ORDER: Tier[] = ['free', 'plus', 'gold', 'vip'];
/** Store entitlement id for each paid level (RevenueCat entitlement identifiers). */
export const TIER_ENTITLEMENT: Record<Exclude<Tier, 'free'>, string> = { plus: SOUL_PLUS, gold: 'soul_gold', vip: 'soul_vip' };
const ENTITLEMENT_TIER = Object.fromEntries(Object.entries(TIER_ENTITLEMENT).map(([k, v]) => [v, k])) as Record<string, Exclude<Tier, 'free'>>;

export interface TierFeatures {
  /** Today's Souls per day; null = no daily limit (everyone eligible, capped for performance). */
  dailySetSize: number | null;
  fullReports: boolean;
  seeLikes: boolean;
  rewind: boolean;
  seePersonaCount: boolean;
  /** Sponsored cards in Today's Souls (CR-25): free and Soul+ only. */
  showAds: boolean;
  /** VIP: write to someone before a mutual like (CR-26). */
  messageFirst: boolean;
}

export const UNLIMITED_DAILY_CAP = 300;

export function tierFeatures(tier: Tier): TierFeatures {
  const rank = TIER_ORDER.indexOf(tier);
  return {
    // Paid levels never get fewer people than the base size (the alpha raises the base to 200 for demos).
    dailySetSize: tier === 'vip' ? null : tier === 'gold' ? Math.max(50, env().DAILY_SET_SIZE) : tier === 'plus' ? Math.max(25, env().DAILY_SET_SIZE) : env().DAILY_SET_SIZE,
    fullReports: rank >= 1,
    seeLikes: rank >= 2,
    rewind: rank >= 2,
    seePersonaCount: rank >= 3,
    showAds: rank < 2,
    messageFirst: rank >= 3,
  };
}

/** Store products per level (prices are shown by the store; these are display hints for the alpha). */
export const PRODUCTS = {
  monthly: 'soul_plus_monthly',
  yearly: 'soul_plus_yearly',
  plus: { monthly: 'soul_plus_monthly', yearly: 'soul_plus_yearly', price: '€4.99' },
  gold: { monthly: 'soul_gold_monthly', yearly: 'soul_gold_yearly', price: '€9.99' },
  vip: { monthly: 'soul_vip_monthly', yearly: 'soul_vip_yearly', price: '€19.99' },
} as const;

/** Test activation (alpha/dev only): no payment, clearly marked, 30 days. */
export const testPurchasesAllowed = () => ['development', 'test', 'alpha'].includes(env().APP_ENV);

const GRANT = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);
const KEEP_UNTIL_EXPIRY = new Set(['CANCELLATION', 'BILLING_ISSUE', 'SUBSCRIPTION_PAUSED']);

export interface RevenueCatEvent {
  id: string;
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  environment?: string;
  store?: string;
}

/** PAY-001/002: entitlements come only from verified store webhooks; clients can never claim premium. */
@Injectable()
export class BillingService {
  private readonly logger = new Logger('Billing');

  constructor(private readonly prisma: PrismaService) {}

  verify(authHeader: string | undefined): void {
    const expected = env().REVENUECAT_WEBHOOK_AUTH;
    const got = authHeader ?? '';
    const ok = !!expected && got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
    if (!ok) throw new AppError(401, 'UNAUTHENTICATED', 'Invalid webhook signature.');
  }

  async handle(event: RevenueCatEvent): Promise<{ status: string }> {
    if (await this.prisma.billingEvent.findUnique({ where: { id: event.id } })) return { status: 'duplicate' };
    const ids = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].filter((x): x is string => !!x);
    const user = ids.length ? await this.prisma.user.findFirst({ where: { billingId: { in: ids } }, select: { id: true } }) : null;
    await this.prisma.billingEvent.create({ data: { id: event.id, type: event.type, userId: user?.id } });
    if (!user) {
      this.logger.warn({ msg: 'billing event for unknown user', type: event.type });
      return { status: 'ignored' };
    }
    const product = event.product_id ?? '';
    const entitlements = new Set((event.entitlement_ids ?? []).filter((e) => e in ENTITLEMENT_TIER));
    for (const [tier, ent] of Object.entries(TIER_ENTITLEMENT)) {
      if (product.startsWith(`soul_${tier}`)) entitlements.add(ent);
    }
    if (!entitlements.size) return { status: 'ignored' };
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const base = { productId: product || 'unknown', store: event.store ?? 'unknown', environment: event.environment ?? 'PRODUCTION' };
    for (const ent of entitlements) {
      if (GRANT.has(event.type) || KEEP_UNTIL_EXPIRY.has(event.type)) {
        await this.upsert(user.id, ent, { ...base, active: true, expiresAt });
      } else if (event.type === 'EXPIRATION') {
        await this.upsert(user.id, ent, { ...base, active: false, expiresAt });
      }
    }
    return { status: 'processed' };
  }

  private upsert(userId: string, entitlement: string, data: { productId: string; store: string; environment: string; active: boolean; expiresAt: Date | null }) {
    return this.prisma.entitlement.upsert({
      where: { userId_entitlement: { userId, entitlement } },
      create: { userId, entitlement, ...data },
      update: data,
    });
  }

  /** The highest active level across the person's profiles (CR-17: subscriptions belong to the person). */
  async tier(userId: string, now = new Date()): Promise<Tier> {
    const rows = await this.prisma.entitlement.findMany({ where: { userId: { in: await familyIds(this.prisma, userId) }, active: true } });
    let best = 0;
    for (const e of rows) {
      const tier = ENTITLEMENT_TIER[e.entitlement];
      if (!tier) continue;
      if (e.environment === 'SANDBOX' && env().APP_ENV === 'production') continue;
      if (e.expiresAt && e.expiresAt <= now) continue;
      best = Math.max(best, TIER_ORDER.indexOf(tier));
    }
    return TIER_ORDER[best]!;
  }

  async features(userId: string): Promise<TierFeatures> {
    return tierFeatures(await this.tier(userId));
  }

  /** Alpha/dev only: switch to a level without paying, so testers can try every feature. Refused in staging/production. */
  async testActivate(userId: string, tier: Tier) {
    if (!testPurchasesAllowed()) throw new AppError(403, 'TEST_PURCHASES_DISABLED', 'Test purchases are only available in the test version.');
    const rootId = await accountRootId(this.prisma, userId);
    await this.prisma.entitlement.updateMany({ where: { userId: rootId, store: 'TEST' }, data: { active: false } });
    if (tier !== 'free') {
      await this.upsert(rootId, TIER_ENTITLEMENT[tier], { productId: `soul_${tier}_test`, store: 'TEST', environment: 'SANDBOX', active: true, expiresAt: new Date(Date.now() + 30 * 86_400_000) });
    }
    return this.status(userId);
  }

  /** Sandbox purchases only count outside production (PAY-002: sandbox on staging/alpha). */
  async hasSoulPlus(userId: string, now = new Date()): Promise<boolean> {
    return TIER_ORDER.indexOf(await this.tier(userId, now)) >= 1;
  }

  async status(userId: string) {
    // Purchases always attach to the owner account so every persona shares them (CR-17).
    const rootId = await accountRootId(this.prisma, userId);
    const tier = await this.tier(userId);
    const [user, e] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: rootId }, select: { billingId: true } }),
      tier === 'free' ? null : this.prisma.entitlement.findUnique({ where: { userId_entitlement: { userId: rootId, entitlement: TIER_ENTITLEMENT[tier] } } }),
    ]);
    return {
      paywallEnabled: env().PAYWALL_ENABLED,
      testPurchases: testPurchasesAllowed(),
      billingId: user.billingId,
      products: PRODUCTS,
      tier,
      features: tierFeatures(tier),
      tiers: TIER_ORDER.map((t) => ({ tier: t, features: tierFeatures(t), price: t === 'free' ? null : PRODUCTS[t].price })),
      expiresAt: e?.expiresAt ?? null,
      store: e?.store ?? null,
      soulPlus: { active: tier !== 'free', expiresAt: e?.expiresAt ?? null, productId: e?.productId ?? null, store: e?.store ?? null },
    };
  }
}
