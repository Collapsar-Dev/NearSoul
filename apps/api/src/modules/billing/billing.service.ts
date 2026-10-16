import { Injectable, Logger } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';

export const SOUL_PLUS = 'soul_plus';
export const PRODUCTS = { monthly: 'soul_plus_monthly', yearly: 'soul_plus_yearly' } as const;

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
    const entitled = (event.entitlement_ids ?? []).includes(SOUL_PLUS) || (event.product_id ?? '').startsWith('soul_plus');
    if (!entitled) return { status: 'ignored' };
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const base = { productId: event.product_id ?? 'unknown', store: event.store ?? 'unknown', environment: event.environment ?? 'PRODUCTION' };
    if (GRANT.has(event.type)) {
      await this.upsert(user.id, { ...base, active: true, expiresAt });
    } else if (KEEP_UNTIL_EXPIRY.has(event.type)) {
      await this.upsert(user.id, { ...base, active: true, expiresAt });
    } else if (event.type === 'EXPIRATION') {
      await this.upsert(user.id, { ...base, active: false, expiresAt });
    }
    return { status: 'processed' };
  }

  private upsert(userId: string, data: { productId: string; store: string; environment: string; active: boolean; expiresAt: Date | null }) {
    return this.prisma.entitlement.upsert({
      where: { userId_entitlement: { userId, entitlement: SOUL_PLUS } },
      create: { userId, entitlement: SOUL_PLUS, ...data },
      update: data,
    });
  }

  /** Sandbox purchases only count outside production (PAY-002: sandbox on staging/alpha). */
  async hasSoulPlus(userId: string, now = new Date()): Promise<boolean> {
    const e = await this.prisma.entitlement.findUnique({ where: { userId_entitlement: { userId, entitlement: SOUL_PLUS } } });
    if (!e?.active) return false;
    if (e.environment === 'SANDBOX' && env().APP_ENV === 'production') return false;
    return !e.expiresAt || e.expiresAt > now;
  }

  async status(userId: string) {
    const [user, e] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { billingId: true } }),
      this.prisma.entitlement.findUnique({ where: { userId_entitlement: { userId, entitlement: SOUL_PLUS } } }),
    ]);
    return {
      paywallEnabled: env().PAYWALL_ENABLED,
      billingId: user.billingId,
      products: PRODUCTS,
      soulPlus: { active: await this.hasSoulPlus(userId), expiresAt: e?.expiresAt ?? null, productId: e?.productId ?? null, store: e?.store ?? null },
    };
  }
}
