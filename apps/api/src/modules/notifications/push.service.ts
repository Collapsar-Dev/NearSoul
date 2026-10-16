import { Injectable, Logger } from '@nestjs/common';
import { createSign } from 'node:crypto';
import webpush from 'web-push';
import { PrismaService } from '../../common/prisma.service';
import { env } from '../../config/env';

export interface PushMessage {
  title: string;
  body: string;
  data: Record<string, string>;
}

export type DeliveryResult = 'ok' | 'gone' | 'error';

/** Network side of push delivery; replaced by a fake in tests. */
export interface PushTransport {
  webPush(subscription: WebPushSubscription, payload: string, vapid: VapidKeys): Promise<DeliveryResult>;
  fcm(token: string, msg: PushMessage): Promise<DeliveryResult>;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/**
 * Browser push services we deliver to. A Web Push endpoint is a URL chosen by the client, so it is
 * restricted to the known services to keep the server from being used to call arbitrary hosts (SSRF).
 */
const WEB_PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^jmt\d+\.google\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^([\w-]+\.)*push\.apple\.com$/, /^([\w-]+\.)*notify\.windows\.com$/];

export function parseWebPushSubscription(token: string): WebPushSubscription | null {
  try {
    const s = JSON.parse(token) as Partial<WebPushSubscription>;
    if (typeof s.endpoint !== 'string' || typeof s.keys?.p256dh !== 'string' || typeof s.keys?.auth !== 'string') return null;
    const url = new URL(s.endpoint);
    if (url.protocol !== 'https:' || !WEB_PUSH_HOSTS.some((h) => h.test(url.hostname))) return null;
    return { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } };
  } catch {
    return null;
  }
}

class HttpPushTransport implements PushTransport {
  private fcmToken: { value: string; expiresAt: number } | null = null;

  async webPush(subscription: WebPushSubscription, payload: string, vapid: VapidKeys): Promise<DeliveryResult> {
    try {
      await webpush.sendNotification(subscription, payload, {
        TTL: 60 * 60,
        urgency: 'normal',
        vapidDetails: { subject: vapid.subject, publicKey: vapid.publicKey, privateKey: vapid.privateKey },
        timeout: 10_000,
      });
      return 'ok';
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      return status === 404 || status === 410 ? 'gone' : 'error';
    }
  }

  /** FCM HTTP v1 with a service-account JWT (no Firebase SDK needed). */
  async fcm(token: string, msg: PushMessage): Promise<DeliveryResult> {
    const sa = serviceAccount();
    if (!sa) return 'error';
    const access = await this.fcmAccessToken(sa);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          data: msg.data,
          android: { priority: 'high', notification: { channel_id: 'default' } },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return 'ok';
    const text = await res.text();
    return res.status === 404 || text.includes('UNREGISTERED') ? 'gone' : 'error';
  }

  private async fcmAccessToken(sa: ServiceAccount): Promise<string> {
    if (this.fcmToken && this.fcmToken.expiresAt > Date.now() + 60_000) return this.fcmToken.value;
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url');
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`FCM auth failed: ${res.status}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.fcmToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return json.access_token;
  }
}

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function serviceAccount(): ServiceAccount | null {
  const raw = env().FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return sa.project_id && sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

/**
 * Push channel (D8/D36, NOTIF-001). Generic texts only: no names or message bodies on the lock screen.
 * Web Push (VAPID) works without any third-party account: keys come from env or are generated once and kept
 * in app_secrets. FCM (Android/iOS apps) turns on when FCM_SERVICE_ACCOUNT_JSON is set.
 * Delivery is best-effort and never blocks the request that caused it; the in-app centre stays the source of truth.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger('Push');
  private vapid: Promise<VapidKeys> | null = null;
  private readonly pending = new Set<Promise<unknown>>();
  transport: PushTransport = new HttpPushTransport();

  constructor(private readonly prisma: PrismaService) {}

  vapidKeys(): Promise<VapidKeys> {
    this.vapid ??= this.loadVapid().catch((e: unknown) => {
      this.vapid = null;
      throw e;
    });
    return this.vapid;
  }

  private async loadVapid(): Promise<VapidKeys> {
    const e = env();
    const subject = e.VAPID_SUBJECT;
    if (e.VAPID_PUBLIC_KEY && e.VAPID_PRIVATE_KEY) return { publicKey: e.VAPID_PUBLIC_KEY, privateKey: e.VAPID_PRIVATE_KEY, subject };
    const stored = await this.prisma.appSecret.findUnique({ where: { key: 'vapid' } });
    if (stored) return { ...(JSON.parse(stored.value) as { publicKey: string; privateKey: string }), subject };
    const fresh = webpush.generateVAPIDKeys();
    // Two instances starting together: the first insert wins and both read it back.
    await this.prisma.appSecret.createMany({ data: [{ key: 'vapid', value: JSON.stringify(fresh) }], skipDuplicates: true });
    const row = await this.prisma.appSecret.findUniqueOrThrow({ where: { key: 'vapid' } });
    return { ...(JSON.parse(row.value) as { publicKey: string; privateKey: string }), subject };
  }

  fcmEnabled(): boolean {
    return serviceAccount() !== null;
  }

  /** Queues delivery and returns immediately. */
  send(userId: string, msg: PushMessage): void {
    const p = this.deliver(userId, msg)
      .catch((err: unknown) => this.logger.warn({ msg: 'push failed', type: msg.data.type, err: String(err) }))
      .finally(() => this.pending.delete(p));
    this.pending.add(p);
  }

  /** Test/shutdown helper: waits for queued deliveries. */
  async flush(): Promise<void> {
    while (this.pending.size) await Promise.all([...this.pending]);
  }

  private async deliver(userId: string, msg: PushMessage): Promise<number> {
    const tokens = await this.prisma.deviceToken.findMany({ where: { session: { userId, revokedAt: null } } });
    let sent = 0;
    for (const t of tokens) {
      let result: DeliveryResult;
      if (t.platform === 'web') {
        const sub = parseWebPushSubscription(t.token);
        if (!sub) {
          result = 'gone';
        } else {
          result = await this.transport.webPush(sub, JSON.stringify(msg), await this.vapidKeys());
        }
      } else if (this.fcmEnabled()) {
        result = await this.transport.fcm(t.token, msg);
      } else {
        continue;
      }
      if (result === 'ok') sent++;
      if (result === 'gone') await this.prisma.deviceToken.deleteMany({ where: { id: t.id } });
    }
    return sent;
  }
}
