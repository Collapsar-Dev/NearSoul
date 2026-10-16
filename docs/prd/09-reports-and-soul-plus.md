> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 9. Reports and the Soul+ subscription

## 9.1 What is free and what is paid
| Feature | Free | Soul+ |
|---|---|---|
| Quick Scan, Deep Personality, Soul Profile with bands, archetype, DNA card | ✓ | ✓ |
| Matching, Today's Souls, Nearby Now, likes, matches, **chat** | ✓ | ✓ |
| Safety, block/report, export, deletion, crisis resources | ✓ always | ✓ |
| Self report: summary (archetype, 5 domains, 3 strengths, relationship style in 3 lines) | ✓ | ✓ |
| **Full self report** (all sections §9.2) | — | ✓ |
| Pair teaser: tier, 3 reasons, 2–3 lines of their card, 3 conversation starters | ✓ | ✓ |
| **Full "You two" pair report** for every match | — | ✓ |
| Layer breakdown on candidate profiles ("Values: strong, Lifestyle: good…") | — | ✓ |
| Soul Talk | 3 sessions / week | Unlimited (within fair‑use limits) |
| P1: "Ask about yourself", premium Soul Talk topics, monthly Soul Report | — | ✓ |

When `PAYWALL_ENABLED=false` (closed beta) everything paid is available to everyone with the label "Free during beta".

## 9.2 Report contents

**RPT-001: Self report (P0)**
- Built by `buildSelfReportData(profile, insights)` (deterministic sections + codes) → AI writer turns each section into prose (§14.3) → validated → cached per `profileVersion`.
- Sections: 1) Your archetype in depth · 2) Your five domains (and facets after Deep) · 3) You in relationships (closeness, independence, reassurance, conflict, care) · 4) What you need from a partner · 5) Your strengths in love · 6) Growth edges (gentle, max 3, phrased as opportunities) · 7) Who you tend to click with (archetypes + layer patterns) · 8) Insights from your Soul Talk (only kept insights) · 9) Questions to reflect on.
- Free part: section 1 short version + domain bands + 3 strengths + 3‑line relationship style.
- Template fallback per section if AI fails.

**RPT-002: Pair report "You two" (P0)**
- Exists only for an **active mutual match**. Deleted on unmatch, block, or either account's deletion.
- Built by `buildPairReportData(A, B, viewer, effectiveShareLevel)` → AI writer → validated → cached per pair + both profile versions + share levels (regenerate at most once per day).
- Sections: 1) Overview: tier + what connects you · 2) Where you click (up to 6 reasons) · 3) Where you might clash (up to 3 frictions + how to handle each) · 4) How to talk to {name} (tips from their L2/L5 within their share level) · 5) Your layers side by side (5 layer tiers; Big Five bands for both only at `deep` level) · 6) First date ideas (from both first‑date preferences, interests, activity tag) · 7) Conversation starters (5).
- **Free teaser** = section 1 short + 3 reasons + 2–3 lines of their DNA card (only if card visibility allows) + 3 starters. Locked section titles are visible with counts (e.g. "Where you might clash · 2").
- Each user sees their **own** view (tips are about the other person). Neither user is notified when the other opens or buys a report.

## 9.3 Consent and reciprocity: share levels (P0)

**RPT-003: Share level**
| Level | What a match can learn about you in pair reports |
|---|---|
| `minimal` | Tier and shared reasons only. No tips about you, no frictions naming your traits, no layer details |
| `standard` (recommended) | + frictions, tips on how to talk to you (from L2/L5), layer tiers |
| `deep` | + your Big Five bands side by side, facet‑based insights, kept Soul Talk insights you marked `card` |

- Chosen explicitly during onboarding (no preselected option, "Standard" visually recommended). Changeable any time in Privacy settings.
- **Reciprocity:** the effective depth of a pair report = `min(levelA, levelB)`. "You see as deep as you share." Paying never increases depth beyond this.
- Raw answers, private Soul Talk content and private insights are **never** included at any level.
- Consent record stored (`consents` type `pair_report_share`, level, version, timestamp).
- AC: viewer `deep` + other `minimal` → report contains only `minimal` sections (test). Changing level invalidates cached reports.

## 9.4 Payments and entitlements (P0 plumbing, enabled by flag)

**PAY-001: Products**: `soul_plus_monthly`, `soul_plus_yearly` (subscriptions, entitlement `soul_plus`). P1: `pair_report_single` (consumable unlock for one pair), `self_report_full` (non‑consumable). Prices per D19, set in the stores.

**PAY-002: Purchase flow**
- RevenueCat Flutter SDK. App user id = a random NearSoul billing id (not email).
- RevenueCat webhook → `POST /v1/billing/webhook` (signature verified) → `entitlements` table updated (active, expires_at, product, store, environment).
- The server checks `soul_plus` on every paid endpoint. Locked content is **never** sent to the client without the entitlement (no client‑side blur of real data). The teaser endpoint returns only teaser data.
- Restore purchases button on the paywall and in Me → Soul+.
- Sandbox purchases work on staging (separate RevenueCat project/environment).

**PAY-003: Paywall rules**
- Shown when a locked item is tapped, plus at most one soft mention per day (e.g. under the pair teaser).
- Must show: benefits list, price, billing period, "auto‑renews until cancelled", how to cancel, Restore, Terms + Privacy links, always‑visible Close.
- No countdown timers, no fake "–70%" discounts, no paywall interrupting a chat or a safety action.
- Cancelling or expiring returns the user to the free tier. Data and matches are never lost.
- AC: with `PAYWALL_ENABLED=false` no paywall is ever shown and paid endpoints return full content (test both flag states).

**PAY-004: Near+ (P2)**: dating perks (see who liked you, incognito, longer Open window, travel mode for the feed only). Separate product, separate decision. Never: priority in nearby alerts over safety rules, seeing who reported you, bypassing blocks, more depth than reciprocity allows.

