import { Injectable } from '@nestjs/common';
import { buildPairReportData, buildPairTeaser, buildSelfReportData, DOMAINS } from '../../engine';
import {
  ARCHETYPES, ARCHETYPE_DISCLAIMER, BAND_TEXT, careLabel, FACET_DOMAIN, FACET_TEXT, codeText, DOMAIN_META, FIRST_DATE_IDEAS, NEED_TEXT, REFLECT_QUESTIONS, SELF_CODES, STARTERS, STRENGTHS, tr, valueLabel, type L, type Locale,
} from '../../content/texts';
import { env } from '../../config/env';
import { badRequest } from '../../common/errors';
import { PrismaService } from '../../common/prisma.service';
import { EngineService } from '../engine/engine.service';
import { ProfileViewService } from '../discovery/profile-view.service';
import { SubjectsService } from '../discovery/subjects.service';
import { ChatService } from '../matches/chat.service';

/** RPT-001/002/003. Locked content is never sent without entitlement (PAY-002). */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: EngineService,
    private readonly subjects: SubjectsService,
    private readonly views: ProfileViewService,
    private readonly chat: ChatService,
  ) {}

  /** Soul+ entitlement. Billing (PAY-001/002) arrives in M9; until then nobody has it. */
  async hasSoulPlus(_userId: string): Promise<boolean> {
    return false;
  }

  private async unlocked(userId: string) {
    if (!env().PAYWALL_ENABLED) return { full: true, freeDuringBeta: true };
    return { full: await this.hasSoulPlus(userId), freeDuringBeta: false };
  }

  async self(userId: string, locale: Locale) {
    const row = await this.engine.getProfile(userId);
    if (!row?.profile.quickScanComplete) throw badRequest('QUICK_SCAN_INCOMPLETE', 'Finish the Quick Scan first.');
    const p = row.profile;
    const data = buildSelfReportData(p);
    const { full, freeDuringBeta } = await this.unlocked(userId);
    const domains = DOMAINS.map((d) => {
      const band = p.domains[d].band;
      const t = band ? BAND_TEXT[d][band] : null;
      return {
        key: d,
        name: tr(DOMAIN_META[d].name, locale),
        low: tr(DOMAIN_META[d].low, locale),
        high: tr(DOMAIN_META[d].high, locale),
        band,
        score: p.domains[d].score,
        confidence: p.domains[d].confidence,
        summary: t ? tr(t.summary, locale) : null,
        ...(full ? { dating: t ? tr(t.dating, locale) : null } : {}),
        // Facets are part of the full report (RPT-001 section 2), available after Deep Personality parts.
        ...(full
          ? {
              facets: Object.entries(p.facets ?? {})
                .filter(([k]) => FACET_DOMAIN[k] === d)
                .map(([k, f]) => ({ key: k, name: tr(FACET_TEXT[k]!.name, locale), low: tr(FACET_TEXT[k]!.low, locale), high: tr(FACET_TEXT[k]!.high, locale), band: f.band, score: f.score })),
            }
          : {}),
      };
    });
    const free = {
      archetype: { key: p.archetype, name: tr(ARCHETYPES[p.archetype].name, locale), line: tr(ARCHETYPES[p.archetype].line, locale), disclaimer: tr(ARCHETYPE_DISCLAIMER, locale) },
      domains,
      strengths: data.strengths.map((s) => tr(STRENGTHS[s] ?? { en: s, ru: s }, locale)),
      relationshipStyle: data.relationshipStyle.map((c) => tr(SELF_CODES[c] ?? { en: c, ru: c }, locale)).slice(0, 3),
      values: (p.values.values.value ?? []).map((v) => valueLabel(v, locale)),
      quality: p.quality,
      depth: p.depth,
      deepPartsCompleted: p.deepPartsCompleted ?? 0,
    };
    if (!full) {
      return { ...free, full: false, freeDuringBeta, locked: [{ key: 'needs', count: data.needs.length }, { key: 'growth', count: data.growthEdges.length }, { key: 'reflect', count: REFLECT_QUESTIONS.length }] };
    }
    return {
      ...free,
      full: true,
      freeDuringBeta,
      needs: data.needs.map((n) => {
        const [key, arg] = n.replace(/^NEED_/, '').split(':') as [string, string | undefined];
        return tr(NEED_TEXT[key] ?? { en: key, ru: key }, locale).replace('{x}', arg ? careLabel(arg, locale) : '');
      }),
      growthEdges: data.growthEdges.map((g) => tr(SELF_CODES[g] ?? { en: g, ru: g }, locale)),
      reflect: REFLECT_QUESTIONS.map((q) => tr(q, locale)),
    };
  }

  async pair(userId: string, matchId: string, locale: Locale) {
    const { otherId } = await this.chat.participantMatch(userId, matchId);
    const subjects = await this.subjects.load([userId, otherId]);
    const me = subjects.get(userId)!;
    const other = subjects.get(otherId);
    if (!other?.profile || !me.profile) throw badRequest('PROFILE_MISSING', 'This report isn’t available.');
    const cfg = await this.engine.matchConfig();
    const compat = this.subjects.compat(me, other, cfg)!;
    const data = buildPairReportData(me.profile, other.profile, compat, me.shareLevel, other.shareLevel);
    const labels = await this.views.interestLabels();
    const name = other.firstName;
    const text = (c: string) => codeText(c, locale, { name, interests: labels });
    const starters = this.starters(data.reasons, locale, labels);
    const { full, freeDuringBeta } = await this.unlocked(userId);
    const card = await this.prisma.personalityCard.findUnique({ where: { userId: otherId } });
    const otherUser = await this.prisma.user.findUniqueOrThrow({ where: { id: otherId }, select: { cardVisibility: true } });
    const teaser = buildPairTeaser(data);
    const base = {
      matchId,
      with: { id: otherId, firstName: name, archetype: { key: other.profile.archetype, name: tr(ARCHETYPES[other.profile.archetype].name, locale) } },
      tier: data.tier,
      effectiveShareLevel: data.effectiveShareLevel,
      reasons: teaser.reasons.map(text),
      cardLines: card && otherUser.cardVisibility !== 'hidden' ? [card.headline, card.summary.split(/(?<=[.!?])\s/)[0] ?? ''].filter(Boolean) : [],
      starters: starters.slice(0, 3),
      freeDuringBeta,
    };
    if (!full) return { ...base, full: false, locked: teaser.lockedSections };
    const weekendA = me.profile.lifestyle.weekend_style.value;
    const weekendB = other.profile.lifestyle.weekend_style.value;
    const ideas = [...new Set([weekendA, weekendB].filter(Boolean) as string[])].map((k) => tr(FIRST_DATE_IDEAS[k] ?? FIRST_DATE_IDEAS.mix!, locale));
    const shared = me.interests.filter((i) => other.interests.includes(i));
    if (shared[0]) ideas.push(locale === 'ru' ? `Что-то, связанное с вашим общим интересом: ${tr(labels[shared[0]] ?? { en: shared[0], ru: shared[0] }, locale)}` : `Something around your shared interest: ${tr(labels[shared[0]] ?? { en: shared[0], ru: shared[0] }, locale)}`);
    return {
      ...base,
      full: true,
      allReasons: data.reasons.map(text),
      frictions: data.frictions.map(text),
      tips: data.tips.map(text),
      layers: data.layers,
      bigFive: data.bigFive,
      firstDateIdeas: ideas.slice(0, 3),
      starters,
    };
  }

  private starters(reasons: string[], locale: Locale, labels: Record<string, L>): string[] {
    const out: string[] = [];
    for (const r of reasons) {
      const [key, arg] = r.split(':') as [string, string | undefined];
      const tpl = STARTERS[key];
      if (!tpl) continue;
      let x = arg ?? '';
      if (key === 'SHARED_VALUE' && arg) x = valueLabel(arg, locale).toLowerCase();
      if (key === 'SHARED_INTEREST' && arg) x = labels[arg] ? tr(labels[arg]!, locale).toLowerCase() : arg;
      if (key === 'SIMILAR_WEEKENDS') x = '';
      const s = tr(tpl, locale).replace('{x}', x);
      if (!out.includes(s)) out.push(s);
      if (out.length >= 5) break;
    }
    if (out.length < 3) out.push(tr(STARTERS.DEFAULT!, locale));
    return out;
  }
}
