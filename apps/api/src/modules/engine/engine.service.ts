import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  DEFAULT_MATCH_CONFIG,
  ITEMS_BY_KEY,
  LIKERT_ACCURACY_LABELS,
  QUICK_SCAN_ITEMS,
  REQUIRED_QUICK_SCAN_KEYS,
  scoreProfile,
  validateAnswer,
  type Answers,
  type LayerOverrides,
  type MatchConfig,
  type SoulProfile,
} from '../../engine';
import { badRequest, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';

export type Locale = 'en' | 'ru';
const pick = (t: { en: string; ru: string | null }, locale: Locale) => ({ text: locale === 'ru' && t.ru ? t.ru : t.en, translated: locale === 'en' || !!t.ru });

/** Engine application service: persistence around the pure Soul Engine (ENG-001..008). */
@Injectable()
export class EngineService {
  private configCache: { at: number; cfg: MatchConfig } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  questionnaire(locale: Locale) {
    const blocks = ['A', 'B', 'C', 'D', 'X'] as const;
    return {
      id: 'quick_scan',
      version: 1,
      likertLabels: LIKERT_ACCURACY_LABELS.map((l) => pick(l, locale).text),
      blocks: blocks.map((b) => ({
        key: b,
        items: QUICK_SCAN_ITEMS.filter((i) => i.block === b).map((i) => ({
          key: i.key,
          type: i.type,
          prompt: pick(i.prompt, locale).text,
          translated: pick(i.prompt, locale).translated,
          optional: !!i.optional,
          minSelect: i.minSelect,
          maxSelect: i.maxSelect,
          anchors: i.anchors ? { low: pick(i.anchors.low, locale).text, high: pick(i.anchors.high, locale).text } : undefined,
          options: i.options?.map((o) => ({ key: o.key, label: pick(o.label, locale).text })),
        })),
      })),
    };
  }

  async saveAnswer(userId: string, itemKey: string, value: unknown) {
    const item = ITEMS_BY_KEY.get(itemKey);
    if (!item) throw notFound('Unknown question');
    const err = validateAnswer(item, value);
    if (err) throw badRequest(err, 'That answer is not valid for this question.');
    await this.prisma.engineAnswer.upsert({
      where: { userId_itemKey: { userId, itemKey } },
      create: { userId, itemKey, itemVersion: item.version, value: value as Prisma.InputJsonValue },
      update: { itemVersion: item.version, value: value as Prisma.InputJsonValue, answeredAt: new Date() },
    });
    return this.recompute(userId);
  }

  async progress(userId: string) {
    const answered = await this.prisma.engineAnswer.findMany({ where: { userId }, select: { itemKey: true } });
    const keys = new Set(answered.map((a) => a.itemKey));
    const next = QUICK_SCAN_ITEMS.find((i) => !keys.has(i.key))?.key ?? null;
    return {
      answered: [...keys],
      required: REQUIRED_QUICK_SCAN_KEYS.length,
      requiredAnswered: REQUIRED_QUICK_SCAN_KEYS.filter((k) => keys.has(k)).length,
      nextItem: next,
      complete: REQUIRED_QUICK_SCAN_KEYS.every((k) => keys.has(k)),
    };
  }

  async loadAnswers(userId: string): Promise<{ answers: Answers; overrides: LayerOverrides }> {
    const [rows, ovs] = await Promise.all([
      this.prisma.engineAnswer.findMany({ where: { userId } }),
      this.prisma.layerOverride.findMany({ where: { userId } }),
    ]);
    const answers: Answers = {};
    for (const r of rows) answers[r.itemKey] = { value: r.value as Answers[string]['value'], answeredAt: r.answeredAt.toISOString() };
    const overrides: LayerOverrides = {};
    for (const o of ovs) overrides[o.traitKey] = { value: o.value as never, updatedAt: o.updatedAt.toISOString(), source: o.source as 'user_edit' | 'soul_talk' };
    return { answers, overrides };
  }

  /** ENG-008: recompute and persist; bumps profile_version so caches (reports, daily sets) can invalidate. */
  async recompute(userId: string): Promise<SoulProfile> {
    const { answers, overrides } = await this.loadAnswers(userId);
    const profile = scoreProfile(answers, { overrides });
    const data = {
      profile: profile as unknown as Prisma.InputJsonValue,
      archetype: profile.archetype,
      depth: profile.depth,
      engineVersion: profile.engineVersion,
      normsVersion: profile.normsVersion,
      computedAt: new Date(),
    };
    await this.prisma.soulProfileRow.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data, profileVersion: { increment: 1 } },
    });
    return profile;
  }

  async getProfile(userId: string): Promise<{ profile: SoulProfile; version: number } | null> {
    const row = await this.prisma.soulProfileRow.findUnique({ where: { userId } });
    return row ? { profile: row.profile as unknown as SoulProfile, version: row.profileVersion } : null;
  }

  async profilesFor(userIds: string[]): Promise<Map<string, { profile: SoulProfile; version: number }>> {
    const rows = await this.prisma.soulProfileRow.findMany({ where: { userId: { in: userIds } } });
    return new Map(rows.map((r) => [r.userId, { profile: r.profile as unknown as SoulProfile, version: r.profileVersion }]));
  }

  /** Layer trait edits by the owner (ENG-009). Big Five can only change by answering again. */
  async editLayers(userId: string, edits: Record<string, string | string[] | number>) {
    const now = new Date();
    for (const [traitKey, value] of Object.entries(edits)) {
      await this.prisma.layerOverride.upsert({
        where: { userId_traitKey: { userId, traitKey } },
        create: { userId, traitKey, value: value as Prisma.InputJsonValue, source: 'user_edit', updatedAt: now },
        update: { value: value as Prisma.InputJsonValue, source: 'user_edit', updatedAt: now },
      });
    }
    return this.recompute(userId);
  }

  async retake(userId: string) {
    await this.prisma.engineAnswer.deleteMany({ where: { userId, itemKey: { startsWith: 'mi_' } } });
    return this.recompute(userId);
  }

  async matchConfig(): Promise<MatchConfig> {
    if (this.configCache && Date.now() - this.configCache.at < 60_000) return this.configCache.cfg;
    const row = await this.prisma.matchConfigRow.findFirst({ where: { active: true } });
    const cfg = (row?.config as unknown as MatchConfig) ?? DEFAULT_MATCH_CONFIG;
    this.configCache = { at: Date.now(), cfg };
    return cfg;
  }
}
