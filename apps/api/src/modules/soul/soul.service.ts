import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { z } from 'zod/v4';
import { tr, type Locale } from '../../content/texts';
import { env } from '../../config/env';
import { AppError, badRequest, forbidden, notFound } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { RateLimiter } from '../../common/rate-limit';
import { AiProvider } from '../ai/ai.provider';
import { EngineService } from '../engine/engine.service';
import {
  crisisResources, GUIDE_PROMPT_VERSION, guideSystem, keywordRisk, SAFETY_MESSAGE, SAFETY_PROMPT_VERSION, SAFETY_SYSTEM,
  SOUL_TOPICS, TOPICS_BY_KEY, UNDERAGE_MESSAGE, WRAPUP_PROMPT_VERSION, WRAPUP_SYSTEM, type SoulTopic,
} from './soul-content';
import { SoulCryptoService } from './soul-crypto.service';

const MAX_TURNS = 20;
const MIN_TURNS_FOR_INSIGHTS = 2;
const RESUME_DAYS = 7;
const SESSIONS_PER_DAY = 3;
const FREE_SESSIONS_PER_WEEK = 3;
const MAX_KEPT_CONTEXT = 10;

export const INSIGHT_CATEGORIES = ['value', 'need', 'pattern', 'strength', 'preference', 'growth'] as const;

const WrapupSchema = z.object({
  summary: z.string().min(10).max(500),
  insights: z
    .array(
      z.object({
        text: z.string().min(3).max(140),
        category: z.enum(INSIGHT_CATEGORIES),
        evidence: z.string().min(3).max(160),
        trait_suggestion: z.object({ trait_key: z.string(), value: z.union([z.string(), z.number(), z.array(z.string())]) }).nullable().optional(),
      }),
    )
    .min(1)
    .max(5),
  question_to_sit_with: z.string().min(5).max(140),
});

const SafetySchema = z.object({ risk: z.enum(['none', 'self_harm', 'harm_to_others', 'abuse_or_danger', 'underage', 'medical_emergency']), confidence: z.number().min(0).max(1) });

/** Returns the validated trait value or null when the suggestion isn't allowed for this topic (SOUL-003). */
export function allowedTraitValue(topic: SoulTopic, key: string, value: unknown): string | number | string[] | null {
  const allowed = topic.allowedTraits[key];
  if (!allowed) return null;
  if (allowed === 'score') return typeof value === 'number' && value >= 0 && value <= 100 ? Math.round(value) : null;
  if (key === 'values') {
    return Array.isArray(value) && value.length === 3 && new Set(value).size === 3 && value.every((v) => allowed.includes(v)) ? [...value].sort() : null;
  }
  if (key === 'care_language') {
    const arr = Array.isArray(value) ? value : [value];
    return arr.length >= 1 && arr.length <= 2 && arr.every((v) => allowed.includes(v as string)) ? (arr as string[]).sort() : null;
  }
  return typeof value === 'string' && allowed.includes(value) ? value : null;
}

/** SOUL-001..008. Every read and write is owner-only; content is encrypted at rest (SOUL-007). */
@Injectable()
export class SoulService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: SoulCryptoService,
    private readonly ai: AiProvider,
    private readonly engine: EngineService,
    private readonly limiter: RateLimiter,
  ) {}

  /** Feature flag + separate AI Self-Discovery consent. */
  async assertAllowed(userId: string): Promise<void> {
    if (!env().SOUL_TALK_ENABLED) throw notFound();
    const c = await this.prisma.consent.findFirst({ where: { userId, type: 'ai_self_discovery' }, orderBy: { createdAt: 'desc' } });
    if (!c?.granted) throw forbidden('SOUL_CONSENT_REQUIRED', 'Please read about Soul Talk and give your consent first.');
  }

  async topics(userId: string, locale: Locale) {
    const sessions = await this.prisma.soulSession.findMany({ where: { userId }, select: { topicKey: true, status: true, id: true, resumeUntil: true } });
    const profile = (await this.engine.getProfile(userId))?.profile;
    // Suggest the topic whose traits are least known yet (lowest-confidence layer, SOUL-001).
    const traitMap: Record<string, { value?: unknown; score?: unknown }> = profile
      ? { ...profile.relationship, ...profile.values, ...profile.lifestyle, ...profile.communication }
      : {};
    const unknown = (traits: string[]) => traits.filter((k) => {
      const r = traitMap[k];
      return !r || (r.value ?? r.score ?? null) === null;
    }).length;
    const items = SOUL_TOPICS.map((t) => {
      const done = sessions.some((s) => s.topicKey === t.key && s.status === 'finished');
      const active = sessions.find((s) => s.topicKey === t.key && s.status === 'active' && s.resumeUntil > new Date());
      return { key: t.key, title: tr(t.title, locale), description: tr(t.description, locale), done, activeSessionId: active?.id ?? null, gaps: unknown(Object.keys(t.allowedTraits)) };
    });
    const suggested = [...items].filter((i) => !i.done).sort((a, b) => b.gaps - a.gaps)[0]?.key ?? null;
    return { suggested, topics: items.map(({ gaps: _g, ...rest }) => rest) };
  }

  private async checkLimits(userId: string) {
    const day = await this.prisma.soulSession.count({ where: { userId, startedAt: { gte: new Date(Date.now() - 86_400_000) } } });
    if (day >= SESSIONS_PER_DAY) throw new AppError(429, 'SOUL_DAILY_LIMIT', 'You can start up to 3 Soul Talks a day. Come back tomorrow.');
    if (env().PAYWALL_ENABLED) {
      const week = await this.prisma.soulSession.count({ where: { userId, startedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } } });
      if (week >= FREE_SESSIONS_PER_WEEK) throw new AppError(402, 'SOUL_WEEKLY_LIMIT', 'You have used this week’s free Soul Talks.');
    }
  }

  async start(userId: string, topicKey: string, locale: Locale) {
    const topic = TOPICS_BY_KEY.get(topicKey);
    if (!topic) throw notFound('Unknown topic');
    await this.checkLimits(userId);
    const session = await this.prisma.soulSession.create({
      data: { userId, topicKey, topicVersion: topic.version, promptVersion: GUIDE_PROMPT_VERSION, resumeUntil: new Date(Date.now() + RESUME_DAYS * 86_400_000) },
    });
    // The opening question is prewritten: no AI call for message 1 (SOUL-002).
    await this.prisma.soulMessage.create({ data: { sessionId: session.id, role: 'guide', bodyEnc: await this.crypto.encrypt(userId, tr(topic.opening, locale)) } });
    return this.get(userId, session.id, locale);
  }

  private async own(userId: string, sessionId: string) {
    const s = await this.prisma.soulSession.findUnique({ where: { id: sessionId } });
    if (!s || s.userId !== userId) throw notFound();
    return s;
  }

  async list(userId: string, locale: Locale) {
    const rows = await this.prisma.soulSession.findMany({ where: { userId }, orderBy: { startedAt: 'desc' }, take: 50 });
    return rows.map((s) => ({ id: s.id, topicKey: s.topicKey, title: TOPICS_BY_KEY.get(s.topicKey) ? tr(TOPICS_BY_KEY.get(s.topicKey)!.title, locale) : s.topicKey, status: s.status, turns: s.turnCount, startedAt: s.startedAt, finishedAt: s.finishedAt }));
  }

  async get(userId: string, sessionId: string, locale: Locale) {
    const s = await this.own(userId, sessionId);
    const msgs = await this.prisma.soulMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
    const topic = TOPICS_BY_KEY.get(s.topicKey);
    return {
      id: s.id,
      topicKey: s.topicKey,
      title: topic ? tr(topic.title, locale) : s.topicKey,
      status: s.status,
      turns: s.turnCount,
      maxTurns: MAX_TURNS,
      canResume: s.status === 'active' && s.resumeUntil > new Date(),
      summary: s.summaryEnc ? await this.crypto.decrypt(userId, s.summaryEnc) : null,
      questionToSitWith: s.questionEnc ? await this.crypto.decrypt(userId, s.questionEnc) : null,
      messages: await Promise.all(msgs.map(async (m) => ({ id: m.id, role: m.role, text: await this.crypto.decrypt(userId, m.bodyEnc), createdAt: m.createdAt }))),
    };
  }

  /** SOUL-006: classify before replying. Keyword check is the backup when the classifier is unavailable. */
  private async risk(text: string, previousGuide: string): Promise<string | null> {
    const keyword = keywordRisk(text);
    if (keyword) return keyword;
    const r = await this.ai.generate({
      feature: 'soul_safety',
      model: env().SOUL_SAFETY_MODEL,
      promptVersion: SAFETY_PROMPT_VERSION,
      system: SAFETY_SYSTEM,
      user: `<previous_guide_message>${previousGuide}</previous_guide_message>\n<latest_user_message>${text}</latest_user_message>`,
      schema: SafetySchema,
      maxTokens: 200,
      timeoutMs: 3000,
    });
    if (r.ok && r.value.risk !== 'none' && r.value.confidence >= 0.5) return r.value.risk;
    return null;
  }

  async send(userId: string, sessionId: string, rawText: string, idempotencyKey: string, locale: Locale, country = 'default') {
    const text = rawText.trim();
    if (!text) throw badRequest('EMPTY_MESSAGE', 'Message is empty.');
    if (text.length > 2000) throw badRequest('MESSAGE_TOO_LONG', 'Messages can be up to 2000 characters.');
    const s = await this.own(userId, sessionId);
    const existing = await this.prisma.soulMessage.findUnique({ where: { sessionId_idempotencyKey: { sessionId, idempotencyKey } } });
    if (existing) {
      // Retried request: return the reply that already followed this message, if any.
      const reply = await this.prisma.soulMessage.findFirst({ where: { sessionId, createdAt: { gt: existing.createdAt } }, orderBy: { createdAt: 'asc' } });
      if (reply) return { reply: { role: reply.role, text: await this.crypto.decrypt(userId, reply.bodyEnc) }, chips: [], turns: s.turnCount };
    }
    if (s.status !== 'active' || s.resumeUntil < new Date()) throw badRequest('SESSION_CLOSED', 'This Soul Talk has ended.');
    if (s.turnCount >= MAX_TURNS) throw badRequest('TURN_LIMIT', 'This Soul Talk is complete. Let’s look at what you discovered.');
    this.limiter.check(`soul-msg:${userId}`, 60, 3_600_000);

    if (!existing) await this.prisma.soulMessage.create({ data: { sessionId, role: 'user', bodyEnc: await this.crypto.encrypt(userId, text), idempotencyKey } });
    const history = await this.prisma.soulMessage.findMany({ where: { sessionId, role: { in: ['user', 'guide'] } }, orderBy: { createdAt: 'asc' } });
    const decoded = await Promise.all(history.map(async (m) => ({ role: m.role === 'user' ? ('user' as const) : ('assistant' as const), content: await this.crypto.decrypt(userId, m.bodyEnc) })));
    const previousGuide = [...decoded].reverse().find((m) => m.role === 'assistant')?.content ?? '';

    const category = await this.risk(text, previousGuide);
    if (category) {
      await this.prisma.safetyEvent.create({ data: { userId, category } });
      const resources = crisisResources(env().CRISIS_RESOURCES, country);
      const fixed = tr(category === 'underage' ? UNDERAGE_MESSAGE : SAFETY_MESSAGE, locale);
      await this.prisma.soulMessage.create({ data: { sessionId, role: 'system_fixed', bodyEnc: await this.crypto.encrypt(userId, fixed) } });
      if (category === 'underage') {
        await this.prisma.soulSession.update({ where: { id: sessionId }, data: { status: 'abandoned', finishedAt: new Date() } });
        await this.prisma.auditEvent.create({ data: { actorType: 'system', action: 'age_review_flag', targetType: 'user', targetId: userId } });
      } else {
        await this.prisma.soulSession.update({ where: { id: sessionId }, data: { status: 'paused_safety' } });
      }
      return { safety: { category: category === 'underage' ? 'underage' : 'support', message: fixed, resources }, turns: s.turnCount };
    }

    const kept = await this.keptInsightTexts(userId);
    const topic = TOPICS_BY_KEY.get(s.topicKey)!;
    const r = await this.ai.converse({
      feature: 'soul_guide',
      model: env().SOUL_MODEL,
      promptVersion: GUIDE_PROMPT_VERSION,
      system: guideSystem(topic, locale, kept, s.turnCount + 1),
      messages: decoded,
      maxTokens: 1200,
    });
    if (!r.ok) {
      // The user's message is kept; the client offers a retry with the same idempotency key (SOUL-002).
      throw new AppError(503, r.reason === 'budget' ? 'SOUL_RESTING' : 'SOUL_RETRY', r.reason === 'budget' ? 'Soul Talk is resting for a bit. Please try again later.' : 'I need a moment, please try again.');
    }
    const { reply, chips } = splitChips(r.text);
    await this.prisma.soulMessage.create({ data: { sessionId, role: 'guide', bodyEnc: await this.crypto.encrypt(userId, reply) } });
    const updated = await this.prisma.soulSession.update({
      where: { id: sessionId },
      data: { turnCount: { increment: 1 }, model: r.model, tokensIn: { increment: r.inputTokens }, tokensOut: { increment: r.outputTokens } },
    });
    return { reply: { role: 'guide', text: reply }, chips, turns: updated.turnCount };
  }

  /** "Continue" after the safety sheet: the user chose to keep reflecting. */
  async resume(userId: string, sessionId: string) {
    const s = await this.own(userId, sessionId);
    if (s.status !== 'paused_safety') throw badRequest('NOT_PAUSED', 'This Soul Talk is not paused.');
    await this.prisma.soulSession.update({ where: { id: sessionId }, data: { status: 'active' } });
  }

  private async keptInsightTexts(userId: string): Promise<string[]> {
    const rows = await this.prisma.soulInsight.findMany({ where: { userId, status: 'kept' }, orderBy: { updatedAt: 'desc' }, take: MAX_KEPT_CONTEXT });
    return Promise.all(rows.map((r) => this.crypto.decrypt(userId, r.textEnc)));
  }

  /** SOUL-003: wrap-up → proposed insights; nothing is saved to the Soul Map until the user keeps it. */
  async finish(userId: string, sessionId: string, locale: Locale) {
    const s = await this.own(userId, sessionId);
    if (s.status === 'finished') return this.wrapView(userId, sessionId, locale);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { soulKeepConversations: true } });
    const purgeAt = user.soulKeepConversations ? null : new Date(Date.now() + env().SOUL_TRANSCRIPT_TTL_DAYS * 86_400_000);
    if (s.turnCount < MIN_TURNS_FOR_INSIGHTS) {
      await this.prisma.soulSession.update({ where: { id: sessionId }, data: { status: 'finished', finishedAt: new Date() } });
      await this.prisma.soulMessage.updateMany({ where: { sessionId }, data: { purgeAt } });
      return { ...(await this.wrapView(userId, sessionId, locale)), tooShort: true };
    }
    const topic = TOPICS_BY_KEY.get(s.topicKey)!;
    const msgs = await this.prisma.soulMessage.findMany({ where: { sessionId, role: { in: ['user', 'guide'] } }, orderBy: { createdAt: 'asc' } });
    const transcript = (await Promise.all(msgs.map(async (m) => `${m.role === 'user' ? 'USER' : 'GUIDE'}: ${await this.crypto.decrypt(userId, m.bodyEnc)}`))).join('\n');
    const allowed = Object.entries(topic.allowedTraits).map(([k, v]) => `${k}: ${v === 'score' ? 'number 0-100' : (v as readonly string[]).join('|')}${k === 'values' ? ' (exactly 3)' : ''}`).join('; ');
    const req = {
      feature: 'soul_wrapup',
      model: env().SOUL_MODEL,
      promptVersion: WRAPUP_PROMPT_VERSION,
      system: WRAPUP_SYSTEM,
      user: `<language>${locale === 'ru' ? 'Russian' : 'English'}</language>\n<topic>${topic.goal}</topic>\n<allowed_traits>${allowed}</allowed_traits>\n<transcript>\n${transcript}\n</transcript>`,
      schema: WrapupSchema,
      maxTokens: 3000,
      timeoutMs: 30000,
    };
    let result = await this.ai.generate(req);
    if (!result.ok && result.reason === 'invalid') result = await this.ai.generate(req);
    if (!result.ok) throw new AppError(503, 'SOUL_RETRY', 'We couldn’t create your insights this time. Please try again.');
    const w = result.value;
    for (const i of w.insights) {
      const value = i.trait_suggestion ? allowedTraitValue(topic, i.trait_suggestion.trait_key, i.trait_suggestion.value) : null;
      await this.prisma.soulInsight.create({
        data: {
          userId,
          sessionId,
          category: i.category,
          textEnc: await this.crypto.encrypt(userId, i.text),
          evidenceEnc: await this.crypto.encrypt(userId, i.evidence),
          traitKey: value === null ? null : i.trait_suggestion!.trait_key,
          traitValue: value === null ? undefined : (value as Prisma.InputJsonValue),
        },
      });
    }
    await this.prisma.soulSession.update({
      where: { id: sessionId },
      data: { status: 'finished', finishedAt: new Date(), summaryEnc: await this.crypto.encrypt(userId, w.summary), questionEnc: await this.crypto.encrypt(userId, w.question_to_sit_with) },
    });
    await this.prisma.soulMessage.updateMany({ where: { sessionId }, data: { purgeAt } });
    return this.wrapView(userId, sessionId, locale);
  }

  private async wrapView(userId: string, sessionId: string, locale: Locale) {
    const view = await this.get(userId, sessionId, locale);
    const insights = await this.prisma.soulInsight.findMany({ where: { sessionId, status: { not: 'discarded' } }, orderBy: { createdAt: 'asc' } });
    return { summary: view.summary, questionToSitWith: view.questionToSitWith, insights: await Promise.all(insights.map((i) => this.insightView(userId, i))) };
  }

  private async insightView(userId: string, i: { id: string; category: string; textEnc: string; evidenceEnc: string; traitKey: string | null; status: string; visibility: string; createdAt: Date; sessionId: string }) {
    return {
      id: i.id,
      sessionId: i.sessionId,
      category: i.category,
      text: await this.crypto.decrypt(userId, i.textEnc),
      evidence: await this.crypto.decrypt(userId, i.evidenceEnc),
      affectsMatching: !!i.traitKey,
      status: i.status,
      visibility: i.visibility,
      createdAt: i.createdAt,
    };
  }

  async insights(userId: string) {
    const rows = await this.prisma.soulInsight.findMany({ where: { userId, status: { not: 'discarded' } }, orderBy: { createdAt: 'desc' } });
    return Promise.all(rows.map((r) => this.insightView(userId, r)));
  }

  /** SOUL-004/005: keep / edit / discard and visibility; only kept `matching` insights change traits. */
  async updateInsight(userId: string, id: string, input: { status?: 'kept' | 'discarded'; text?: string; visibility?: 'private' | 'matching' | 'card' }) {
    const i = await this.prisma.soulInsight.findUnique({ where: { id } });
    if (!i || i.userId !== userId) throw notFound();
    const updated = await this.prisma.soulInsight.update({
      where: { id },
      data: {
        status: input.status,
        visibility: input.visibility,
        ...(input.text ? { textEnc: await this.crypto.encrypt(userId, input.text), userEdited: true } : {}),
      },
    });
    const applies = updated.status === 'kept' && updated.visibility === 'matching' && updated.traitKey && updated.traitValue !== null;
    if (applies) {
      await this.prisma.layerOverride.upsert({
        where: { userId_traitKey: { userId, traitKey: updated.traitKey! } },
        create: { userId, traitKey: updated.traitKey!, value: updated.traitValue as Prisma.InputJsonValue, source: 'soul_talk', insightId: id, updatedAt: new Date() },
        update: { value: updated.traitValue as Prisma.InputJsonValue, source: 'soul_talk', insightId: id, updatedAt: new Date() },
      });
    } else {
      await this.prisma.layerOverride.deleteMany({ where: { userId, insightId: id } });
    }
    await this.engine.recompute(userId);
    if (updated.status === 'discarded') await this.prisma.soulInsight.delete({ where: { id } });
    return updated.status === 'discarded' ? { id, status: 'discarded' } : this.insightView(userId, updated);
  }

  async soulMap(userId: string) {
    const kept = await this.prisma.soulInsight.findMany({ where: { userId, status: 'kept' }, orderBy: { createdAt: 'asc' } });
    const items = await Promise.all(kept.map((k) => this.insightView(userId, k)));
    const byCategory = Object.fromEntries(INSIGHT_CATEGORIES.map((c) => [c, items.filter((i) => i.category === c)]));
    return { byCategory, timeline: items.map((i) => ({ id: i.id, text: i.text, at: i.createdAt })), count: items.length };
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.own(userId, sessionId);
    const ids = (await this.prisma.soulInsight.findMany({ where: { sessionId }, select: { id: true } })).map((r) => r.id);
    await this.prisma.layerOverride.deleteMany({ where: { userId, insightId: { in: ids } } });
    await this.prisma.soulSession.delete({ where: { id: sessionId } });
    await this.engine.recompute(userId);
  }

  async deleteAll(userId: string) {
    await this.prisma.layerOverride.deleteMany({ where: { userId, source: 'soul_talk' } });
    await this.prisma.soulSession.deleteMany({ where: { userId } });
    await this.crypto.destroy(userId);
    await this.engine.recompute(userId);
  }

  async settings(userId: string, keepConversations: boolean) {
    await this.prisma.user.update({ where: { id: userId }, data: { soulKeepConversations: keepConversations } });
    const finished = (await this.prisma.soulSession.findMany({ where: { userId, status: 'finished' }, select: { id: true, finishedAt: true } }));
    for (const s of finished) {
      const purgeAt = keepConversations ? null : new Date((s.finishedAt ?? new Date()).getTime() + env().SOUL_TRANSCRIPT_TTL_DAYS * 86_400_000);
      await this.prisma.soulMessage.updateMany({ where: { sessionId: s.id }, data: { purgeAt } });
    }
    return { keepConversations };
  }

  /** Retention: transcripts past their purge date; stale sessions are closed after the resume window. */
  async purge(now = new Date()): Promise<void> {
    await this.prisma.soulMessage.deleteMany({ where: { purgeAt: { lt: now } } });
    await this.prisma.soulSession.updateMany({ where: { status: { in: ['active', 'paused_safety'] }, resumeUntil: { lt: now } }, data: { status: 'abandoned', finishedAt: now } });
  }
}

/** Splits an optional trailing `CHIPS: [...]` line from the guide reply. */
export function splitChips(text: string): { reply: string; chips: string[] } {
  const m = /\n?\s*CHIPS:\s*(\[.*\])\s*$/s.exec(text);
  if (!m) return { reply: text.trim().slice(0, 1200), chips: [] };
  let chips: string[] = [];
  try {
    const parsed = JSON.parse(m[1]!) as unknown;
    if (Array.isArray(parsed)) chips = parsed.filter((c): c is string => typeof c === 'string').map((c) => c.slice(0, 40)).slice(0, 3);
  } catch {
    chips = [];
  }
  return { reply: text.slice(0, m.index).trim().slice(0, 1200), chips };
}
