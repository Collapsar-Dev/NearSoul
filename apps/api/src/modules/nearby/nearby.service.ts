import { AnalyticsService } from '../analytics/analytics.service';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { randomInt } from 'node:crypto';
import { eligibility } from '../../engine';
import { env } from '../../config/env';
import { AppError, badRequest, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import type { Locale } from '../../content/texts';
import { EngineService } from '../engine/engine.service';
import { ProfileViewService } from '../discovery/profile-view.service';
import { SubjectsService } from '../discovery/subjects.service';
import { NotificationsService, pushText } from '../notifications/notifications.service';
import { MapService } from './map.service';
import { BAND_LABEL, bandFor, distanceM, RADIUS_OPTIONS_M, snap, type Band } from './geo';

const FRESH_MS = 15 * 60_000;
const MAX_ACCURACY_M = 500;
const MAX_SPEED_KMH = 300;
const OPEN_MAX_PER_DAY = 3;
const ALERTS_PER_WINDOW = 5;
const PAIR_COOLDOWN_MS = 7 * 86_400_000;
const MAX_DELAY_SEC = 180;
const LOCATION_TTL_MS = 24 * 3_600_000;

/** GEO-001..007. Raw coordinates are never stored or logged — only the snapped H3 cell centre. */
@Injectable()
export class NearbyService {
  private readonly logger = new Logger('Nearby');

  constructor(
    private readonly prisma: PrismaService,
    private readonly limiter: RateLimiter,
    private readonly subjects: SubjectsService,
    private readonly engine: EngineService,
    private readonly views: ProfileViewService,
    private readonly notifications: NotificationsService,
    private readonly analytics: AnalyticsService,
    private readonly map: MapService,
  ) {}

  private async activeSession(userId: string, now = new Date()) {
    return this.prisma.nearbySession.findFirst({ where: { userId, endedAt: null, openUntil: { gt: now } }, orderBy: { startedAt: 'desc' } });
  }

  async updateLocation(userId: string, input: { lat: number; lng: number; accuracyM: number }, opts: { simulated?: boolean } = {}) {
    this.limiter.check(`loc:${userId}`, 30, 3_600_000);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { discoveryEnabled: true } });
    const session = await this.activeSession(userId);
    if (!user.discoveryEnabled && !session && !(await this.map.isSharing(userId))) throw badRequest('LOCATION_NOT_NEEDED', 'Turn on Open to meet to share your approximate area.');
    if (input.accuracyM > MAX_ACCURACY_M) throw badRequest('LOCATION_INACCURATE', 'Your location is too imprecise right now. Try again outside or on your phone.');
    const snapped = snap(input.lat, input.lng);
    const prev = await this.prisma.userLocation.findUnique({ where: { userId } });
    if (prev && !opts.simulated && !prev.simulated) {
      const hours = Math.max((Date.now() - prev.updatedAt.getTime()) / 3_600_000, 1 / 3600);
      const kmh = distanceM(prev, snapped) / 1000 / hours;
      if (kmh > MAX_SPEED_KMH) {
        await this.prisma.auditEvent.create({ data: { actorType: 'system', action: 'location_speed_flag', targetType: 'user', targetId: userId } });
        return { accepted: false };
      }
    }
    await this.prisma.userLocation.upsert({
      where: { userId },
      create: { userId, h3Cell: snapped.cell, lat: snapped.lat, lng: snapped.lng, simulated: !!opts.simulated },
      update: { h3Cell: snapped.cell, lat: snapped.lat, lng: snapped.lng, simulated: !!opts.simulated, updatedAt: new Date() },
    });
    if (session) await this.matchFor(userId);
    return { accepted: true, simulated: !!opts.simulated };
  }

  async open(userId: string, input: { durationMin: 60 | 120 | 240; radiusM: number; activity?: string | null }) {
    if (!(RADIUS_OPTIONS_M as readonly number[]).includes(input.radiusM)) throw badRequest('INVALID_RADIUS', 'Choose 500 m, 1 km, 3 km or 10 km.');
    const today = await this.prisma.nearbySession.count({ where: { userId, startedAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (today >= OPEN_MAX_PER_DAY) throw new AppError(429, 'OPEN_LIMIT', 'You can open up to 3 times a day.');
    await this.prisma.nearbySession.updateMany({ where: { userId, endedAt: null }, data: { endedAt: new Date() } });
    await this.prisma.nearbySession.create({
      data: { userId, radiusM: input.radiusM, activity: input.activity ?? null, openUntil: new Date(Date.now() + input.durationMin * 60_000) },
    });
    this.analytics.track(userId, 'open_to_meet_started', { count: input.durationMin });
    await this.matchFor(userId);
    return this.status(userId);
  }

  async close(userId: string) {
    const s = await this.activeSession(userId);
    if (s) await this.endSession(s.id, userId);
    return this.status(userId);
  }

  async status(userId: string) {
    const [s, loc] = await Promise.all([this.activeSession(userId), this.prisma.userLocation.findUnique({ where: { userId } })]);
    return {
      open: !!s,
      openUntil: s?.openUntil ?? null,
      radiusM: s?.radiusM ?? null,
      activity: s?.activity ?? null,
      location: loc ? { fresh: Date.now() - loc.updatedAt.getTime() < FRESH_MS, simulated: loc.simulated, updatedAt: loc.updatedAt } : null,
    };
  }

  /** GEO-006: find compatible open users nearby and schedule one alert to both. */
  async matchFor(userId: string, now = new Date()) {
    const mine = await this.activeSession(userId, now);
    const myLoc = await this.prisma.userLocation.findUnique({ where: { userId } });
    if (!mine || !myLoc || now.getTime() - myLoc.updatedAt.getTime() > FRESH_MS) return 0;
    const freshSince = new Date(now.getTime() - FRESH_MS);
    const others = await this.prisma.nearbySession.findMany({
      where: { userId: { not: userId }, endedAt: null, openUntil: { gt: now } },
      select: { userId: true, radiusM: true, activity: true, startedAt: true },
    });
    if (!others.length) return 0;
    const locs = await this.prisma.userLocation.findMany({ where: { userId: { in: others.map((o) => o.userId) }, updatedAt: { gte: freshSince } } });
    const locBy = new Map(locs.map((l) => [l.userId, l]));
    const candidates = others.filter((o) => {
      const l = locBy.get(o.userId);
      return l && distanceM(myLoc, l) <= Math.min(mine.radiusM, o.radiusM);
    });
    if (!candidates.length) return 0;
    const ids = candidates.map((c) => c.userId);
    const [subjects, facts, cfg] = await Promise.all([this.subjects.load([userId, ...ids], now), this.subjects.pairFacts(userId, ids), this.engine.matchConfig()]);
    const me = subjects.get(userId);
    if (!me) return 0;
    let scheduled = 0;
    for (const c of candidates) {
      const s = subjects.get(c.userId);
      if (!s) continue;
      const e = eligibility(me.eligibility, s.eligibility, { mode: 'nearby', blockedEitherWay: facts.blocked.has(s.id), previouslyMatched: facts.matched.has(s.id), passedRecently: facts.passed.has(s.id) });
      if (!e.eligible) continue;
      const compat = this.subjects.compat(me, s, cfg);
      if (!compat || compat.score < cfg.nearbyMinScore) continue;
      const recent = await this.prisma.nearbyAlert.findFirst({
        where: { createdAt: { gte: new Date(now.getTime() - PAIR_COOLDOWN_MS) }, OR: [{ userA: userId, userB: s.id }, { userA: s.id, userB: userId }] },
      });
      if (recent) continue;
      if ((await this.alertsInWindow(userId, mine.startedAt)) >= ALERTS_PER_WINDOW) break;
      if ((await this.alertsInWindow(s.id, c.startedAt)) >= ALERTS_PER_WINDOW) continue;
      const meHide = (await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { hideDistance: true } })).hideDistance;
      const otherHide = (await this.prisma.user.findUniqueOrThrow({ where: { id: s.id }, select: { hideDistance: true } })).hideDistance;
      const band = bandFor(distanceM(myLoc, locBy.get(s.id)!), meHide || otherHide);
      const delay = env().APP_ENV === 'test' ? 0 : randomInt(0, MAX_DELAY_SEC + 1);
      await this.prisma.nearbyAlert.create({ data: { userA: userId, userB: s.id, band, score: compat.score, deliverAt: new Date(now.getTime() + delay * 1000) } });
      scheduled++;
    }
    return scheduled;
  }

  private alertsInWindow(userId: string, since: Date) {
    return this.prisma.nearbyAlert.count({ where: { createdAt: { gte: since }, OR: [{ userA: userId }, { userB: userId }] } });
  }

  /** Delivers due alerts (random 0–3 min delay breaks timing correlation). */
  async deliverDue(now = new Date()) {
    const due = await this.prisma.nearbyAlert.findMany({ where: { sentAt: null, deliverAt: { lte: now } }, take: 200 });
    for (const a of due) {
      const claimed = await this.prisma.nearbyAlert.updateMany({ where: { id: a.id, sentAt: null }, data: { sentAt: now } });
      if (!claimed.count) continue;
      this.analytics.track(a.userA, 'nearby_alert_sent');
      this.analytics.track(a.userB, 'nearby_alert_sent');
      for (const [me, other] of [[a.userA, a.userB], [a.userB, a.userA]] as const) {
        const u = await this.prisma.user.findUnique({ where: { id: me }, select: { locale: true } });
        const locale = (u?.locale === 'ru' ? 'ru' : 'en') as Locale;
        await this.notifications.notify(me, 'nearby_alert', { alertId: a.id, userId: other, band: a.band }, { bodyOverride: `${pushText('nearby_alert', locale).body} ${BAND_LABEL[a.band as Band][locale]}.` });
      }
    }
    return due.length;
  }

  async list(userId: string, locale: Locale) {
    const session = await this.prisma.nearbySession.findFirst({ where: { userId }, orderBy: { startedAt: 'desc' } });
    if (!session) return { items: [] };
    const alerts = await this.prisma.nearbyAlert.findMany({
      where: { sentAt: { not: null, gte: session.startedAt }, OR: [{ userA: userId }, { userB: userId }] },
      orderBy: { sentAt: 'desc' },
    });
    const otherIds = alerts.map((a) => (a.userA === userId ? a.userB : a.userA));
    const [subjects, facts, cfg, later, sessions] = await Promise.all([
      this.subjects.load([userId, ...otherIds]),
      this.subjects.pairFacts(userId, otherIds),
      this.engine.matchConfig(),
      this.prisma.nearbyLater.findMany({ where: { userId, sessionId: session.id } }),
      this.prisma.nearbySession.findMany({ where: { userId: { in: otherIds }, endedAt: null }, select: { userId: true, activity: true } }),
    ]);
    const me = subjects.get(userId)!;
    const laterSet = new Set(later.map((l) => l.targetId));
    const activity = new Map(sessions.map((s) => [s.userId, s.activity]));
    const items = [];
    for (const a of alerts) {
      const otherId = a.userA === userId ? a.userB : a.userA;
      const s = subjects.get(otherId);
      if (!s || facts.blocked.has(otherId) || s.eligibility.status !== 'active') continue;
      const view = await this.views.build(me, s, this.subjects.compat(me, s, cfg), locale, { distanceBand: BAND_LABEL[a.band as Band][locale], activity: activity.get(otherId) ?? null });
      items.push({ alertId: a.id, at: a.sentAt, later: laterSet.has(otherId), action: facts.liked.has(otherId) ? 'like' : facts.passed.has(otherId) ? 'pass' : null, matched: facts.matched.has(otherId), profile: view });
    }
    return { windowOpen: !session.endedAt && session.openUntil > new Date(), items };
  }

  async later(userId: string, targetId: string) {
    const session = await this.activeSession(userId);
    if (!session) throw badRequest('NOT_OPEN', 'Open to meet has ended.');
    const alert = await this.prisma.nearbyAlert.findFirst({ where: { sentAt: { not: null, gte: session.startedAt }, OR: [{ userA: userId, userB: targetId }, { userA: targetId, userB: userId }] } });
    if (!alert) throw notFound();
    await this.prisma.nearbyLater.upsert({ where: { userId_targetId_sessionId: { userId, targetId, sessionId: session.id } }, create: { userId, targetId, sessionId: session.id }, update: {} });
  }

  private async endSession(sessionId: string, userId: string) {
    await this.prisma.nearbySession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
    await this.prisma.nearbyLater.deleteMany({ where: { sessionId } });
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { discoveryEnabled: true } });
    if (!u?.discoveryEnabled && !(await this.map.isSharing(userId))) await this.prisma.userLocation.deleteMany({ where: { userId } });
  }

  /** Server is the source of truth for expiry (GEO-005) and location TTL (D29). */
  async housekeeping(now = new Date()) {
    const expired = await this.prisma.nearbySession.findMany({ where: { endedAt: null, openUntil: { lte: now } } });
    for (const s of expired) await this.endSession(s.id, s.userId);
    const ending = await this.prisma.nearbySession.findMany({ where: { endedAt: null, openUntil: { gt: now, lte: new Date(now.getTime() + 10 * 60_000) } } });
    for (const s of ending) {
      const already = await this.prisma.notification.findFirst({ where: { userId: s.userId, type: 'open_ending', payload: { path: ['sessionId'], equals: s.id } } });
      if (!already) await this.notifications.notify(s.userId, 'open_ending', { sessionId: s.id });
    }
    await this.prisma.userLocation.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - LOCATION_TTL_MS) } } });
    await this.map.housekeeping(now);
    return expired.length;
  }

  @Interval(15_000)
  async tickDeliver() {
    if (env().APP_ENV === 'test') return;
    try {
      await this.deliverDue();
    } catch (e) {
      this.logger.error({ msg: 'deliver failed', err: (e as Error).message });
    }
  }

  @Interval(60_000)
  async tickHousekeeping() {
    if (env().APP_ENV === 'test') return;
    try {
      await this.housekeeping();
      const open = await this.prisma.nearbySession.findMany({ where: { endedAt: null, openUntil: { gt: new Date() } }, select: { userId: true } });
      for (const o of open) await this.matchFor(o.userId);
    } catch (e) {
      this.logger.error({ msg: 'housekeeping failed', err: (e as Error).message });
    }
  }
}
