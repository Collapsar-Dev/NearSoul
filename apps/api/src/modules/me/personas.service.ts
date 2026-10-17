import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { badRequest, notFound } from '../../common/errors';
import { accountRootId, familyIds, MAX_PERSONAS } from '../../common/family';
import { PrismaService } from '../../common/prisma.service';
import { ARCHETYPES } from '../../content/texts';
import type { ArchetypeKey } from '../../engine';

/**
 * Personas (CR-17, founder request): one sign-in account can hold up to three fully separate profiles, each with its
 * own Quick Scan, photos, daily set, likes, matches and chats. Age, language and timezone come from the owner; profiles
 * of the same person are never shown to each other, and moderation applies to all of them.
 */
@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, locale: 'en' | 'ru' = 'en') {
    const ids = await familyIds(this.prisma, userId);
    const rows = await this.prisma.user.findMany({
      where: { id: { in: ids }, status: { notIn: ['deleted', 'deletion_requested'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, parentId: true, personaLabel: true, status: true,
        profile: { select: { firstName: true } },
        soulProfile: { select: { archetype: true } },
        _count: { select: { notifications: { where: { readAt: null } } } },
      },
    });
    return {
      max: MAX_PERSONAS,
      items: rows.map((r) => ({
        id: r.id,
        isOwner: r.parentId === null,
        current: r.id === userId,
        label: r.personaLabel,
        firstName: r.profile?.firstName ?? null,
        archetype: r.soulProfile?.archetype ? (ARCHETYPES[r.soulProfile.archetype as ArchetypeKey]?.name[locale] ?? null) : null,
        onboarded: r.status === 'active',
        unread: r._count.notifications,
      })),
    };
  }

  async create(userId: string, label: string) {
    const rootId = await accountRootId(this.prisma, userId);
    const root = await this.prisma.user.findUniqueOrThrow({ where: { id: rootId } });
    if (!root.dob || !root.ageGatePassedAt) throw badRequest('ONBOARDING_INCOMPLETE', 'Finish your first profile before adding another.');
    if (['suspended', 'deleted', 'deletion_requested', 'blocked_underage'].includes(root.status)) throw notFound('Account not found');
    const count = await this.prisma.user.count({ where: { OR: [{ id: rootId }, { parentId: rootId }], status: { notIn: ['deleted', 'deletion_requested'] } } });
    if (count >= MAX_PERSONAS) throw badRequest('TOO_MANY_PERSONAS', `You can have up to ${MAX_PERSONAS} profiles.`);
    const consents = await this.prisma.consent.findMany({ where: { userId: rootId }, orderBy: { createdAt: 'asc' } });
    const persona = await this.prisma.$transaction(async (tx) => {
      const p = await tx.user.create({
        data: {
          parentId: rootId,
          personaLabel: label,
          role: root.role,
          // Age is the person's, not the profile's: copied and locked.
          dob: root.dob,
          ageGatePassedAt: root.ageGatePassedAt,
          locale: root.locale,
          timezone: root.timezone,
          onboardingStep: 'scan',
        },
      });
      if (consents.length) {
        await tx.consent.createMany({
          data: consents.map((c) => ({ userId: p.id, type: c.type, version: c.version, value: c.value === null ? Prisma.JsonNull : (c.value as Prisma.InputJsonValue), granted: c.granted })),
        });
      }
      return p;
    });
    return { id: persona.id };
  }

  async rename(userId: string, personaId: string, label: string, locale: 'en' | 'ru' = 'en') {
    const ids = await familyIds(this.prisma, userId);
    if (!ids.includes(personaId)) throw notFound('Profile not found');
    await this.prisma.user.update({ where: { id: personaId }, data: { personaLabel: label } });
    return this.list(userId, locale);
  }
}
