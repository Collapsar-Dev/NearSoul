import { Injectable } from '@nestjs/common';
import { cellToLatLng, latLngToCell } from 'h3-js';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { demoAllowed } from '../alpha/demo.service';
import { StorageService } from '../storage/storage.service';
import { distanceM, snap } from './geo';

/** Matches see an area, not a home: H3 res 8 (≈ 460 m edge) centre, distance rounded to 100 m (CR-29). */
export const MAP_RES = 8;
export const MAP_DURATIONS_MIN = [60, 240] as const;
/** A shared spot older than this is not shown (the person stopped opening the app). */
const MAP_FRESH_MS = 6 * 3_600_000;

export function areaOf(p: { lat: number; lng: number }) {
  const [lat, lng] = cellToLatLng(latLngToCell(p.lat, p.lng, MAP_RES));
  return { lat, lng };
}

export const approxMeters = (m: number) => Math.max(100, Math.round(m / 100) * 100);

/**
 * CR-29 "Show me on the map": owner opt-in, matches only, approximate area, ends on time or when turned off.
 * Strangers never appear on the map (they keep distance bands in Nearby).
 */
@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  private active(userId: string, now = new Date()) {
    return this.prisma.mapShare.findFirst({ where: { userId, OR: [{ until: null }, { until: { gt: now } }] } });
  }

  async isSharing(userId: string) {
    return !!(await this.active(userId));
  }

  async share(userId: string, durationMin: number | null) {
    const until = durationMin ? new Date(Date.now() + durationMin * 60_000) : null;
    await this.prisma.mapShare.upsert({ where: { userId }, create: { userId, until }, update: { until, createdAt: new Date() } });
    return this.view(userId);
  }

  async stop(userId: string) {
    await this.prisma.mapShare.deleteMany({ where: { userId } });
    return this.view(userId);
  }

  async housekeeping(now = new Date()) {
    await this.prisma.mapShare.deleteMany({ where: { until: { lte: now } } });
  }

  /** The viewer's own spot plus matches who share theirs. */
  async view(userId: string, now = new Date()) {
    const [me, share] = await Promise.all([this.prisma.userLocation.findUnique({ where: { userId } }), this.active(userId, now)]);
    const matches = await this.prisma.match.findMany({ where: { endedAt: null, OR: [{ userLow: userId }, { userHigh: userId }] } });
    const byOther = new Map(matches.map((m) => [m.userLow === userId ? m.userHigh : m.userLow, m.id]));
    const ids = [...byOther.keys()];
    if (ids.length && demoAllowed() && me) await this.placeDemos(ids, me, now);
    const blocks = ids.length ? await this.prisma.block.findMany({ where: { OR: [{ blockerId: userId, blockedId: { in: ids } }, { blockedId: userId, blockerId: { in: ids } }] } }) : [];
    const blocked = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));
    const people = ids.length
      ? await this.prisma.user.findMany({
          where: {
            id: { in: ids.filter((id) => !blocked.has(id)) },
            status: 'active',
            hiddenByModeration: false,
            mapShare: { OR: [{ until: null }, { until: { gt: now } }] },
            location: { updatedAt: { gt: new Date(now.getTime() - MAP_FRESH_MS) } },
          },
          include: { location: true, profile: { select: { firstName: true } }, photos: { where: { status: 'ready' }, orderBy: { position: 'asc' }, take: 1 } },
        })
      : [];
    const friends = await Promise.all(people.map(async (u) => {
      const area = areaOf(u.location!);
      return {
        userId: u.id,
        matchId: byOther.get(u.id)!,
        firstName: u.profile?.firstName ?? '',
        photo: u.photos[0] ? await this.storage.signedUrl(u.photos[0].storageKey) : null,
        lat: area.lat,
        lng: area.lng,
        approxM: me ? approxMeters(distanceM(me, area)) : null,
        updatedAt: u.location!.updatedAt,
      };
    }));
    friends.sort((a, b) => (a.approxM ?? 1e9) - (b.approxM ?? 1e9));
    return {
      me: me ? { lat: me.lat, lng: me.lng, updatedAt: me.updatedAt, simulated: me.simulated } : null,
      sharing: share ? { until: share.until } : null,
      friends,
    };
  }

  /** Alpha only: demo matches "share" a spot within ~3 km of the tester, so the map can be tried. */
  private async placeDemos(ids: string[], me: { lat: number; lng: number }, now: Date) {
    const demos = await this.prisma.user.findMany({ where: { id: { in: ids }, isDemo: true }, select: { id: true, location: { select: { updatedAt: true } } } });
    for (const d of demos) {
      if (d.location && now.getTime() - d.location.updatedAt.getTime() < MAP_FRESH_MS / 2) continue;
      const angle = (randomInt(360) * Math.PI) / 180;
      const km = 0.3 + randomInt(270) / 100;
      const p = snap(me.lat + (km / 111) * Math.cos(angle), me.lng + (km / (111 * Math.cos((me.lat * Math.PI) / 180))) * Math.sin(angle));
      await this.prisma.userLocation.upsert({
        where: { userId: d.id },
        create: { userId: d.id, h3Cell: p.cell, lat: p.lat, lng: p.lng, simulated: true },
        update: { h3Cell: p.cell, lat: p.lat, lng: p.lng, simulated: true, updatedAt: now },
      });
      await this.prisma.mapShare.upsert({ where: { userId: d.id }, create: { userId: d.id, until: null }, update: {} });
    }
  }
}
