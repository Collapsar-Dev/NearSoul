import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';
import { PrismaService } from '../../common/prisma.service';

/** Event dictionary (docs/analytics-events.md). Anything not listed here is dropped. */
export const EVENTS = [
  'account_created', 'age_gate_passed', 'consent_given', 'quick_scan_completed', 'archetype_assigned', 'deep_part_completed',
  'share_level_set', 'profile_completed', 'discovery_enabled', 'discovery_disabled', 'daily_set_viewed', 'like_sent', 'pass_sent',
  'match_created', 'first_message_sent', 'conversation_reached_10_messages', 'open_to_meet_started', 'nearby_alert_sent',
  'pair_report_viewed', 'self_report_viewed', 'soul_session_started', 'soul_session_finished', 'soul_insight_reviewed',
  'block_created', 'report_submitted', 'export_requested', 'account_deletion_requested',
] as const;
export type AnalyticsEvent = (typeof EVENTS)[number];

/** Allowed property keys and value shapes: no PII, no answers, no coordinates, no content (ANL-001). */
const ALLOWED_PROPS = new Set(['platform', 'city', 'tier', 'archetype', 'source', 'part', 'level', 'topic', 'turns', 'ended_by', 'action', 'category', 'visibility', 'engine_version', 'match_config_version', 'count']);

export function sanitize(props: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!ALLOWED_PROPS.has(k)) continue;
    if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string' && /^[a-z0-9_.:-]{1,40}$/i.test(v)) out[k] = v; // codes only, never free text
  }
  return out;
}

/**
 * Privacy-safe product analytics (ANL-001): only with the user's analytics consent, keyed by a random
 * analytics id (never the user id or email). No-op without POSTHOG_KEY. Never throws into business code.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger('Analytics');
  /** Test hook: captured events when no key is configured. */
  readonly captured: { distinctId: string; event: string; properties: Record<string, unknown> }[] = [];

  constructor(private readonly prisma: PrismaService) {}

  track(userId: string, event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
    void this.send(userId, event, props).catch(() => this.logger.warn({ msg: 'analytics send failed', event }));
  }

  private async send(userId: string, event: AnalyticsEvent, props: Record<string, unknown>): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { analyticsId: true, isDemo: true } });
    if (!user || user.isDemo) return;
    const consent = await this.prisma.consent.findFirst({ where: { userId, type: 'analytics' }, orderBy: { createdAt: 'desc' } });
    if (!consent?.granted) return;
    const payload = { distinctId: user.analyticsId, event, properties: { ...sanitize(props), env: env().APP_ENV } };
    const key = env().POSTHOG_KEY;
    if (!key) {
      if (env().APP_ENV === 'test' || env().APP_ENV === 'development') this.captured.push(payload);
      return;
    }
    await fetch(`${env().POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: key, event, distinct_id: payload.distinctId, properties: { ...payload.properties, $process_person_profile: false } }),
    });
  }
}
