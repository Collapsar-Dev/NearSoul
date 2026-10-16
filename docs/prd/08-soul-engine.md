> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 8. Soul Engine: the heart of NearSoul

## 8.1 What the engine does
```
 INPUTS                         ENGINE (pure, deterministic, versioned)                 OUTPUTS
 ───────                        ─────────────────────────────────────                   ───────
 Quick Scan answers  ─┐   ┌─► 1. Item scoring (reverse keys, Likert → 0–100)       ┌─► Soul Profile (per user)
 Deep Personality    ─┼──►│   2. Domain & facet scores + bands + confidence    ───┤   Soul Archetype
 Profile facts       ─┤   │   3. Relationship / values / lifestyle / comm. layers   │   Self report data
 Kept Soul Talk      ─┘   │   4. Quality checks (consistency, straight-lining)      │
 insights (matching)      └─► 5. Pair compatibility (filters → layer scores →   ───┼─► Tier, score, confidence
                               reasons & frictions → tips)                          │   Reason / friction codes
                                                                                    └─► Pair report data
 AI (writer only) turns engine outputs into warm prose. It never changes numbers, filters or access.
```

**Module boundaries (code):**
- `engine/items`: item bank types, loading, validation.
- `engine/scoring`: `scoreProfile(answers, itemBank, engineVersion) → SoulProfile`.
- `engine/archetype`: `deriveArchetype(profile) → ArchetypeKey`.
- `engine/compat`: `eligibility(a, b, ctx) → boolean + reason`, `compatibility(a, b, config) → CompatResult`.
- `engine/explain`: reason/friction catalog, `buildSelfReportData`, `buildPairReportData(a, b, shareLevel)`.
- All pure functions, no DB, no network, no clock (time passed in). ≥ 95% line coverage. Property‑based tests (fast‑check) for symmetry and bounds.

## 8.2 Profile layers (what "who you are" means)
| Layer | Source | Dimensions | Used for |
|---|---|---|---|
| **L1 Personality (Big Five)** | Quick Scan (Mini‑IPIP, 20 items) → refined by Deep Personality (IPIP‑NEO‑120) | Openness · Conscientiousness · Extraversion · Agreeableness · Emotional Stability (= reversed Neuroticism). After Deep: 6 facets each (30) | Profile, archetype, compatibility (weight 0.15), reports |
| **L2 Relationship dynamics** | Quick Scan block B, Level 3 (P1), Soul Talk | closeness_comfort · reassurance_need · independence_need · conflict_style · care_language · affection_expression | Compatibility (0.25), reports, tips |
| **L3 Values & life goals** | Quick Scan block C, Level 4 (P1), Soul Talk | values (top 3 of 10) · kids_plan · life_direction · money_style (P1) | Compatibility (0.30), reports |
| **L4 Lifestyle** | Quick Scan block D, profile facts | weekend_style · spontaneity · activity_level · chronotype (P1) · smoking · drinking | Compatibility (0.15) |
| **L5 Communication** | Quick Scan block D, Soul Talk | texting_rhythm · conversation_depth · humor (P1) | Compatibility (0.15), conversation tips |
| **Hard constraints** | Profile | intent · gender/interested_in · age range · dealbreakers | Eligibility filters only (never scored) |

Soul Talk insights may update **L2–L5 only**. Big Five scores come **only** from validated questionnaire items, never from AI.

## 8.3 Questionnaires

**ENG-001: Item bank (P0)**
- Items stored in DB (`engine_items`), versioned: `item_key, instrument (mini_ipip|ipip_neo_120|ns_custom), version, layer, dimension, facet?, keyed (+1|-1), type (likert5|single|multi|rank), prompt (jsonb per locale), options?, active`.
- Likert scale (all Big Five items): 1 "Very inaccurate" · 2 "Moderately inaccurate" · 3 "Neither" · 4 "Moderately accurate" · 5 "Very accurate". Prompt frame: "How accurately does this describe you?"
- IPIP items are public domain. The agent imports the exact item texts from the official IPIP site (ipip.ori.org), records sources and the licence statement in `docs/engine/sources.md` and an ADR. **Russian versions:** use an existing published IPIP Russian translation if available. Otherwise a professional translation + back‑translation (`CONFIRM`). Mark untranslated items so they're never shown in ru.
- Custom NearSoul items (`ns_custom`) are in Appendix A and may be reworded by the founder (keys stay stable).
- AC: changing an item's text creates a new version. Old answers keep pointing to the version they answered.

**ENG-002: Quick Scan (P0)**: 37 items, ~6 min, during onboarding (Appendix A):
| Block | Title shown | Items |
|---|---|---|
| A | How you are | 20 Mini‑IPIP items (4 per Big Five domain), shuffled within the block (fixed seed per user) |
| B | How you love | 6 relationship items |
| C | What matters | 3 items (values top 3, kids, life direction) |
| D | How you live | 7 items (lifestyle + communication) |
| + | Hard no's (optional) | 1 multi‑select dealbreaker item |
- One item per screen. Likert answers advance automatically after 250 ms. Back button allowed. Progress bar. A short, fun interstitial between blocks ("Nice. Now, how do you love?").
- Skips allowed: max 2 per Big Five domain. More skips → that domain shows "Not enough answers yet" and confidence is low.
- Answers saved one by one (offline queue with retry). Resume where the user left off.
- AC: a user who completes the Quick Scan gets a Soul Profile within 2 s (engine computation is synchronous and fast, AI card is async).

**ENG-003: Deep Personality (P0)**: IPIP‑NEO‑120, split into 4 parts of 30 items (~4 min each). Parts can be done on different days. After each part the engine recomputes and shows "New facets unlocked". When all 4 parts are done, domain scores come from the 120 items (Mini‑IPIP answers are kept for history but no longer used for domains). The Soul tab shows "Profile depth" (see ENG‑006).

**ENG-004: Level 3 Love & Relationship deep dive, Level 4 Values deep dive (P1)**: ~20 custom items each, same mechanics. Improve L2 and L3 confidence.

## 8.4 Scoring

**ENG-005: Scoring rules (P0)**
- Reverse‑keyed item: `x' = 6 − x`.
- Domain/facet raw mean `m` over answered items (1–5) → **score** `s = round((m − 1) / 4 × 100)` (0–100).
- **Emotional Stability** `= 100 − Neuroticism score`. Store Neuroticism internally, **display only Emotional Stability** with positive framing for both ends.
- **Bands** (shown to users instead of numbers):
  - `NORMS_MODE=theoretical` (default at launch): low < 35, balanced 35–65, high > 65.
  - `NORMS_MODE=empirical` (switch when ≥ 1,000 completed profiles per locale): percentile within the locale's NearSoul population: low < 30th, balanced 30–70th, high > 70th. Norm tables recomputed monthly by a job and versioned. No gender‑specific norms.
- Custom single‑choice items map to categorical traits (Appendix A). Likert custom items use the same 0–100 transform.
- Output type `SoulProfile`:
```ts
type DimensionResult = { key: string; score: number|null; band: 'low'|'balanced'|'high'|null;
                         confidence: number; source: 'quick_scan'|'deep'|'level3'|'level4'|'soul_talk'; };
type SoulProfile = { engineVersion: string; normsVersion: string;
                     domains: Record<'O'|'C'|'E'|'A'|'S', DimensionResult>;
                     facets?: Record<string, DimensionResult>;            // after Deep Personality
                     relationship: {...}; values: {...}; lifestyle: {...}; communication: {...};
                     quality: { consistencyFlags: string[]; straightLining: boolean };
                     depth: number;                                      // 0–100, see ENG-006
                     archetype: ArchetypeKey; computedAt: string; };
```

**ENG-006: Confidence, depth and quality checks (P0)**
- Per dimension `confidence = answered / expected` × `0.7` if a consistency flag hits that dimension.
- **Consistency flag:** in a domain, a positively keyed item and a reverse‑keyed item both answered at the same extreme (e.g. "Am the life of the party" = 5 and "Keep in the background" = 5).
- **Straight‑lining:** ≥ 90% identical answers in block A → profile still computed, user sees "Your answers were very similar. Want to review a few?" (optional), confidence × 0.7.
- **Profile depth** (0–100) = Quick Scan 40 + Deep Personality 30 (7.5 per part) + kept Soul Talk insights up to 15 + Level 3/4 up to 15. Shown as a progress ring on the Soul tab.
- AC: unit tests for each flag and the depth formula.

**ENG-007: Archetype (P0)**: deterministic `deriveArchetype`: take the two domains with the highest scores among those in the `high` band (ties → fixed order O, C, E, A, S). Map the pair to one of 10 archetypes. If fewer than two domains are `high` → use the highest single domain + "balanced" variant. If none → **The Harmonizer**. The table is in Appendix B. The archetype is always shown with the line "A friendly summary of your strongest traits, not a box."

**ENG-008: Recompute pipeline (P0)**
- Triggers: answer saved (debounced 2 s), Deep part completed, Soul Talk insight kept/changed, profile intent/dealbreakers changed, new `ENGINE_VERSION` or `normsVersion`.
- Recompute the profile synchronously for the owner. Enqueue a job that invalidates the cached compatibility for this user (daily set, pair report caches).
- `ENGINE_VERSION` bump → background job recomputes all profiles in batches. Profiles store which version produced them.
- AC: same answers + same versions ⇒ byte‑identical profile JSON (snapshot test).

## 8.5 Presenting "who you are"

**ENG-009: Soul Profile screen (P0)**
- Header: archetype name + illustration + one‑line description.
- **Constellation**: 5 domains as stars, size = score band (no raw numbers by default; "Show details" toggles the 0–100 values for the owner only).
- Each domain row: name, both poles ("Reflective ←→ Outgoing"), the user's band, 2–3 sentence description (from founder‑approved band texts in `docs/engine/band-texts.md`, en + ru), a "What this means in dating" line.
- After Deep Personality: facets expandable under each domain.
- Layers section: relationship style, values (top 3 icons), lifestyle, communication: short sentences.
- Confidence: domains with low confidence show "Answer a few more questions to sharpen this".
- "Go deeper" CTAs: Deep Personality part X, Soul Talk topic suggestion.
- The owner can **correct** categorical layer traits (L2–L5) via an edit sheet. Big Five can only change by answering items again ("Retake").
- AC: no negative labels appear anywhere (lint test over band texts for a banned word list: neurotic, unstable, lazy, cold, etc.).

**ENG-010: Personality DNA card (P0)**
- Generated by the AI writer from the Soul Profile (bands and categorical traits only, never raw answers) + kept insights marked `card`. Prompt contract §14.2.
- Output (validated JSON): `headline` ≤60, `summary` ≤300, `communication_style` ≤140, `ideal_first_date` ≤140, `strengths` exactly 3 tags ≤20 chars.
- Fallback: template builder from bands (Appendix D fragments) when AI is off, the AI consent is declined, timeout 8 s, or invalid output twice. Marked `source=template`. The user sees no error.
- User review: **Show on profile / Edit / Hide**. Edits saved as `user_edited=true` and never overwritten without asking. Label: "Written with AI from your answers" (or "Written from your answers" for templates).
- Visibility: `everyone` | `matches_only` (default) | `hidden`.

## 8.6 Matching: who fits you

**ENG-011: Hard eligibility filters (P0)**: applied before scoring, in SQL where possible. Candidate B is eligible for viewer A only if **all** are true:
1. Both `status=active`, age gate passed, onboarding complete, Quick Scan complete, ≥ 2 photos.
2. Both have discovery on (daily set) / both are Open to meet (nearby).
3. Gender ↔ interested_in fits both ways.
4. Ages are inside both users' age ranges.
5. Intents compatible (matrix §8.7).
6. No block either way. No previous match/unmatch. No pass by A in the last 30 days (`PASS_COOLDOWN_DAYS`).
7. Neither is hidden by moderation.
8. Dealbreakers respected both ways (e.g. A has "smoker" → B with `smoking=regularly` excluded, and vice versa).

## 8.7 Intent matrix
| | long_term | open_to_long | casual | not_sure |
|---|---|---|---|---|
| **long_term** | ✓ | ✓ | ✗ | ✓ |
| **open_to_long** | ✓ | ✓ | ✓ | ✓ |
| **casual** | ✗ | ✓ | ✓ | ✓ |
| **not_sure** | ✓ | ✓ | ✓ | ✓ |

Same intent → multiplier 1.00. Other allowed pair → 0.92.

## 8.8 Compatibility model v2

**ENG-012: Score (P0)**: `compatibility(A, B, config) → { score 0–100, tier, layerScores, reasons[], frictions[], tips[], confidence }`

**Design rationale (for the founder and agent):** research consistently finds that shared **values, life goals and relationship expectations** matter most for relationships, while plain *personality similarity* predicts relationship outcomes only weakly. Some traits work by **level** (two warm, emotionally steady people tend to do well) rather than by similarity. So the model weights values and relationship dynamics highest, and treats personality as a smaller, mixed similarity/level layer. The engine is still "similar souls first", as the product promises, but in the dimensions where similarity actually helps.

Helpers (all inputs 0–100, outputs 0–1):
- `sim(a,b) = 1 − |a − b| / 100`
- `level(a,b) = (a + b) / 200`
- `ord(a,b,n) = 1 − |a − b| / (n − 1)` for ordinal categories with n steps
- `overlap(setA, setB, k) = |A ∩ B| / k`

| Layer (weight) | Dimension (inner weight) | Formula |
|---|---|---|
| **Values & life goals (0.30)** | values (0.5) | `overlap(top3A, top3B, 3)` |
| | kids_plan (0.3) | table: same direction = 1, `open`/`not_sure` with anything = 0.5, `want` vs `dont_want`/`have_no_more` = 0 |
| | life_direction (0.2) | same = 1, `balance_all` with anything = 0.6, else 0.2 |
| **Relationship dynamics (0.25)** | closeness_comfort (0.25) | `sim` |
| | independence_need (0.25) | `sim` |
| | reassurance fit (0.20) | `1 − max(0, rA + iB − 130)/70` averaged with the mirrored term (r = reassurance_need, i = independence_need). Penalizes "needs lots of reassurance" + "needs lots of space" |
| | conflict_style (0.20) | same = 1, `talk_now`↔`cool_down_then_talk` = 0.6, `let_it_go`↔`talk_now` = 0.2, `let_it_go`↔`cool_down` = 0.5 |
| | care_language (0.10) | any overlap = 1, else 0.4 |
| **Lifestyle (0.15)** | weekend_style (0.25) | same = 1, `mix` with anything = 0.6, else 0.2 |
| | spontaneity (0.25) | `sim` |
| | activity_level (0.2) | `ord(…, 4)` |
| | smoking (0.15), drinking (0.15) | `ord` (3 and 4 steps) |
| **Communication (0.15)** | texting_rhythm (0.5) | `ord(…, 4)` |
| | conversation_depth (0.5) | `sim` |
| **Personality (0.15)** | Openness (0.25) | `sim` |
| | Conscientiousness (0.20) | `sim` |
| | Extraversion (0.15) | `0.7·sim + 0.3` (differences are fine) |
| | Agreeableness (0.20) | `0.5·sim + 0.5·level` |
| | Emotional Stability (0.20) | `0.5·sim + 0.5·level` |

- Layer score = weighted mean of the dimensions known for **both** users. Overall: `score = 100 × intentMultiplier × Σ(wL·layerL) / Σ(wL known)`. `confidence = Σ(wL·layerConfidence) / Σ(wL all)`.
- Unknown data is **excluded**, never treated as negative.
- After Deep Personality (both users), the Personality layer may use facet‑level sims (P1, behind `USE_FACETS_IN_MATCH`).
- **Tiers:** ≥ 75 Strong match · 55–74 Good match · 35–54 Some common ground · < 35 not shown in nearby alerts, last in the daily set.
- All weights, inner weights, tables and thresholds live in `match_config` (versioned JSON). Code holds only the formulas.
- AC (unit + property tests): symmetric `score(A,B) = score(B,A)`. Bounded 0–100. Deterministic. Removing a dimension from one user never lowers the score by treating it as 0. Incompatible intents never reach scoring. Golden‑file tests for 20 hand‑made persona pairs reviewed by the founder.

**ENG-013: Reasons, frictions, tips (P0)**
- **Reasons** (1–3 for cards, up to 6 in reports): the highest‑contributing matched dimensions → reason codes (Appendix C). Example: `SHARED_VALUE:adventure` → "Adventure is one of the top values for both of you."
- **Frictions** (0–1 on cards, up to 3 in the full pair report): dimensions with the lowest sub‑scores where both are known → friction codes, always with a constructive line: `PACE_MISMATCH` → "One of you plans, the other improvises. Agree early on how spontaneous your first date should be."
- **Tips** (pair report): from the *other* person's relationship and communication layers, within their share level: `TIP_GIVE_TIME_AFTER_CONFLICT`, `TIP_TEXT_DAILY_CHECKIN`, `TIP_DEEP_QUESTIONS`.
- Never reveal raw answers. Reasons/frictions about the other person respect their share level (§9.3).

**ENG-014: Daily set: Today's Souls (P0)**
- Job at 12:00 local per user (or immediately after onboarding): eligible candidates in the user's city/feed radius → compute compatibility → rank `score × freshness(last_active ≤ 7 d) × newUserBoost(first 7 days ×1.1)` → diversity rule (no more than 3 of the same archetype in a row) → top `DAILY_SET_SIZE` stored in `daily_sets`.
- Candidates seen in the last 30 days are excluded unless liked‑back logic applies.
- Not enough candidates → widen feed radius and age range by steps (+5 km, ±2 years, max 2 steps, only within the user's "allow flexible" setting, default on) → still empty → honest empty state.
- Payment never affects ranking.
- AC: the set is stable during the day (same order on refresh). Integration test for each fallback step.

## 8.9 Engine quality and learning loop

**ENG-015: Outcome signals (P0 collection, P1 tuning)**
- Collected per pair (pseudonymous, aggregated for analysis): shown → liked (each side) → matched → first message → conversation reached 10 messages each → (P1) "Did you meet?" in‑chat prompt after 7 days → (P1) "Would you like to see them again?".
- Monthly offline report (`docs/engine/quality-YYYY-MM.md`, generated by a script from aggregates): how outcome rates change with tier and each layer score. Used by the founder to propose new `match_config` versions.
- A/B testing: users are bucketed by a hash. Each bucket can use a different `match_config` version. Analytics events include `match_config_version`.
- No per‑user black‑box ML in MVP. A learned ranking model is P2 and needs a separate consent and PRD.

**ENG-016: Engine guardrails (P0)**
- No protected attributes (ethnicity, religion, health, orientation beyond the user's own interested_in) are used as scoring features. Faith appears only as a *value* the user chose in their top 3.
- No clinical labels. Band texts are reviewed against a banned‑words list (lint test).
- Users can see and correct every categorical trait. Big Five changes only through answering.
- Every result references `engineVersion`, `normsVersion`, `matchConfigVersion` for reproducibility.
- Explanations never claim certainty ("may", "tend to", "could").

