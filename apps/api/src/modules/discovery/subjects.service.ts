import { Injectable } from '@nestjs/common';
import type { Gender, Intent } from '@prisma/client';
import { compatibility, type CompatResult, type EligibilitySubject, type MatchConfig, type SoulProfile } from '../../engine';
import { familyIds } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';
import { ageOn } from '../me/me.service';

export interface Subject {
  id: string;
  eligibility: EligibilitySubject & { id: string };
  profile: SoulProfile | null;
  profileVersion: number;
  intent: Intent;
  interests: string[];
  cityId: string | null;
  isDemo: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  firstName: string;
  shareLevel: 'minimal' | 'standard' | 'deep';
}

/** Loads users in the shape the pure engine needs (eligibility + compatibility subjects). */
@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async load(ids: string[], now = new Date()): Promise<Map<string, Subject>> {
    if (!ids.length) return new Map();
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      include: { profile: { include: { interests: true } }, soulProfile: true, _count: { select: { photos: { where: { status: 'ready' } } } } },
    });
    const open = await this.prisma.nearbySession.findMany({ where: { userId: { in: ids }, endedAt: null, openUntil: { gt: now } }, select: { userId: true } });
    const openSet = new Set(open.map((o) => o.userId));
    const out = new Map<string, Subject>();
    for (const u of users) {
      const sp = (u.soulProfile?.profile as unknown as SoulProfile | undefined) ?? null;
      const p = u.profile;
      out.set(u.id, {
        id: u.id,
        profile: sp,
        profileVersion: u.soulProfile?.profileVersion ?? 0,
        intent: (p?.intent ?? 'not_sure') as Intent,
        interests: p?.interests.map((i) => i.interestId) ?? [],
        cityId: p?.cityId ?? null,
        isDemo: u.isDemo,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        firstName: p?.firstName ?? '',
        shareLevel: u.shareLevel ?? 'minimal',
        eligibility: {
          id: u.id,
          status: u.status,
          ageGatePassed: !!u.ageGatePassedAt,
          onboardingComplete: u.status === 'active',
          quickScanComplete: !!sp?.quickScanComplete,
          photoCount: u._count.photos,
          discoveryEnabled: u.discoveryEnabled,
          openToMeet: openSet.has(u.id),
          hiddenByModeration: u.hiddenByModeration,
          gender: (p?.gender ?? 'non_binary') as Gender,
          interestedIn: (p?.interestedIn ?? []) as Gender[],
          age: u.dob ? ageOn(u.dob, now) : 0,
          ageMin: p?.ageMin ?? 18,
          ageMax: p?.ageMax ?? 99,
          intent: (p?.intent ?? 'not_sure') as Intent,
          dealbreakers: sp?.dealbreakers ?? [],
          smoking: sp?.lifestyle.smoking.value ?? null,
          drinking: sp?.lifestyle.drinking.value ?? null,
          kidsPlan: sp?.values.kids_plan.value ?? null,
        },
      });
    }
    return out;
  }

  async one(id: string, now = new Date()): Promise<Subject | null> {
    return (await this.load([id], now)).get(id) ?? null;
  }

  compat(a: Subject, b: Subject, cfg: MatchConfig): CompatResult | null {
    if (!a.profile || !b.profile) return null;
    return compatibility({ profile: a.profile, intent: a.intent, interests: a.interests }, { profile: b.profile, intent: b.intent, interests: b.interests }, cfg);
  }

  /** Pair context facts for eligibility (blocks, previous matches, recent passes by the viewer). */
  async pairFacts(viewerId: string, otherIds: string[], passCooldownDays = 30) {
    const since = new Date(Date.now() - passCooldownDays * 86_400_000);
    // CR-17 personas: profiles of one person never meet, and a block against one profile covers all of them.
    const viewerFamily = await familyIds(this.prisma, viewerId);
    const others = await this.prisma.user.findMany({ where: { id: { in: otherIds } }, select: { id: true, parentId: true } });
    const rootOf = new Map(others.map((o) => [o.id, o.parentId ?? o.id]));
    const roots = [...new Set(rootOf.values())];
    const otherFamilies = await this.prisma.user.findMany({ where: { OR: [{ id: { in: roots } }, { parentId: { in: roots } }] }, select: { id: true, parentId: true } });
    for (const f of otherFamilies) rootOf.set(f.id, f.parentId ?? f.id);
    const otherFamilyIds = otherFamilies.map((f) => f.id);
    const [blocks, matches, likes] = await Promise.all([
      this.prisma.block.findMany({ where: { OR: [{ blockerId: { in: viewerFamily }, blockedId: { in: otherFamilyIds } }, { blockedId: { in: viewerFamily }, blockerId: { in: otherFamilyIds } }] } }),
      this.prisma.match.findMany({ where: { OR: [{ userLow: viewerId, userHigh: { in: otherIds } }, { userHigh: viewerId, userLow: { in: otherIds } }] } }),
      this.prisma.like.findMany({ where: { actorId: viewerId, targetId: { in: otherIds } } }),
    ]);
    const blockedRoots = new Set(blocks.map((b) => rootOf.get(viewerFamily.includes(b.blockerId) ? b.blockedId : b.blockerId)));
    const blocked = new Set(otherIds.filter((id) => viewerFamily.includes(id) || blockedRoots.has(rootOf.get(id))));
    const matched = new Set(matches.map((m) => (m.userLow === viewerId ? m.userHigh : m.userLow)));
    const passed = new Set(likes.filter((l) => l.action === 'pass' && l.createdAt > since).map((l) => l.targetId));
    const liked = new Set(likes.filter((l) => l.action === 'like').map((l) => l.targetId));
    return { blocked, matched, passed, liked };
  }
}
