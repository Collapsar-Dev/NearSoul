> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 5. User experience (UX)

## 5.1 Experience principles
1. **Value before asking.** The user sees their own Soul Profile *before* we ask for photos or location. The first "aha" is about themselves.
2. **Feel understood, never judged.** Every trait is described by the strengths of both ends ("Reflective" and "Outgoing", "Steady" and "Feels deeply"). No negative labels.
3. **Progressive depth.** 6 minutes to a first profile. Deeper layers (Deep Personality, Soul Talk) unlock more insight over days, never all at once.
4. **Few, meaningful choices.** 15 curated people a day instead of infinite swiping. Every card says *why* this person.
5. **Calm and safe.** Soft visuals, clear privacy explanations at the moment they matter, easy exits.
6. **Honest delight.** Moments of joy (reveal animation, archetype card, "You're both nearby") built on real events, never fake ones.
7. **Respect attention.** No guilt streaks, no infinite feed, notifications are useful and few.

## 5.2 Emotional journey
| Stage | What the user feels | What we do |
|---|---|---|
| Install / Welcome | Curious, slightly sceptical ("another dating app?") | Lead with the self‑discovery promise: "Find out who you are in love, in 6 minutes" |
| Quick Scan | Engaged if fast, bored if long | One question per screen, big tap targets, progress bar, playful micro‑copy between blocks, ~6 min total |
| **Soul Profile reveal (aha #1)** | "Wow, that's me" | Animated reveal of the archetype, 5 domain bars with positive descriptions, 3 strengths. Share card (P1) |
| Profile + photos | Willing, because they got value | Short, with tips. Photos framed as "let compatible people see you" |
| Today's Souls (aha #2) | "These people actually fit me" | Each card leads with tier + top reason, not just the photo |
| Nearby Now | Excited but cautious | Clear privacy explanation, distance ranges only, easy stop |
| Mutual match (aha #3) | Happy, slightly nervous | "You two" teaser with shared reasons + 3 conversation starters → easy first message |
| Conversation | Confident or stuck | Starters, "How to talk to them" tips (Soul+), safety tips on suspicious content |
| Ongoing | Growing, reflective | Soul Talk, Deep Personality, Soul Map timeline: "You've learned 12 things about yourself" |

## 5.3 Moments of truth (must be excellent)
1. **Quick Scan completion.** Target hypothesis ≥ 75% of starters complete it.
2. **The reveal.** The first profile must feel accurate and kind. Founder reviews all band texts.
3. **First Today's Souls.** The set must never be empty in the launch city. Fallback: widen distance and age by small steps, then show an honest empty state with Nearby and Soul Talk suggestions.
4. **First message after a match.** Starters must be specific to the pair.

## 5.4 Information architecture (bottom navigation)
| Tab | Contents |
|---|---|
| **Today** | Today's Souls (daily set), candidate profiles, "next set in 3 h" state |
| **Nearby** | Open to meet controls, Nearby list, alert cards |
| **Soul** (centre, highlighted) | Soul Profile, archetype, Deep Personality progress, Soul Talk topics, Soul Map, self report |
| **Matches** | New matches row, conversations, pair reports |
| **Me** | Own dating profile preview, photos, edit, settings, Soul+ status |

## 5.5 Tone of voice
| Do | Don't |
|---|---|
| Warm, simple, specific: "You recharge in calm one‑to‑one time." | Clinical: "You score low on extraversion." |
| Honest: "Compatibility is a starting point, not a promise." | Hype: "Your soulmate is 300 m away!" |
| Inclusive, gender‑neutral by default | Assumptions about gender roles |
| Gentle about differences: "You plan, they improvise. That can balance you." | Alarming: "Warning: incompatible!" |
| Poetic touches in moderation ("souls", "spark") | Cheesy overload |

## 5.6 Visual direction
Warm, calm, trustworthy, not neon or "hookup". Primary: soft coral/rose. Secondary: deep indigo (the "soul" colour, used for the engine and Soul tab). Neutral warm greys, lots of white space, rounded cards. Motifs: a gentle **pulse** for Nearby, a **constellation** for the Soul Profile (each domain a star). Light + dark mode. The final design system is a separate task (`CONFIRM`).

## 5.7 UX rules for every screen (P0)
Loading / success / error / offline states · double‑tap protection on create actions · dynamic type up to 200% · screen‑reader labels · colour never the only signal · touch targets ≥ 44 pt · reduced motion respected · all strings localizable (ARB, en + ru) · no exact location anywhere · cancel/back always visible · one primary action per screen.

## 5.8 Ethical engagement rules
- Max 1 push per day for non‑conversation reasons (daily set *or* a reminder), quiet hours 23:00–08:00 (`CONFIRM`).
- No streaks with loss mechanics. Progress is shown as growth ("12 insights"), never as something you'll lose.
- Paywall shown only when the user taps a locked item, plus at most one soft mention per day. No timers, no fake discounts.
- Every notification is backed by a real event.


## 5.9 Responsive layouts (Web, Desktop, Mobile)

| Breakpoint | Width | Navigation | Layout pattern |
|---|---|---|---|
| **Compact** (phones) | < 600 px | Bottom navigation bar (5 tabs) | One pane, full‑screen cards, bottom sheets |
| **Medium** (tablets, small windows) | 600–1023 px | Navigation rail (left, icons + labels) | One pane with wider cards, max content width 640 px, dialogs instead of full‑screen sheets |
| **Expanded** (desktop, large tablets) | ≥ 1024 px | Navigation rail with labels (or a 240 px sidebar ≥ 1280 px) | **Two panes** where useful, max app width 1440 px, centred |

Two‑pane rules (Expanded):
| Area | Left pane | Right pane |
|---|---|---|
| Today | Current candidate card (480 px) | Full candidate profile + "Why you might click" |
| Matches | Conversations list (360 px) | Selected chat, with a "You two" side panel (collapsible, 360 px) at ≥ 1280 px |
| Soul | Soul Profile constellation + navigation (Profile, Deep, Soul Talk, Soul Map, Report) | Selected section |
| Nearby | Controls + Nearby list | Selected nearby card |
| Settings | Settings tree | Selected settings page |

Other rules: the Quick Scan, Soul Talk session and paywall stay in a centred single column (max 560 px) on all sizes, for focus. Modals ≤ 560 px wide on desktop. Images keep aspect ratio (profile photos 4:5). Typography scales by breakpoint (body 16/16/17 px). No horizontal scrolling at any width ≥ 320 px.

## 5.10 Design tokens & components (starting point, refined in the design‑system task)
| Token | Light | Dark |
|---|---|---|
| `color.primary` (coral/rose) | #E8636F | #F0848D |
| `color.soul` (deep indigo) | #3B3B98 | #8C8CF0 |
| `color.bg` | #FFFBF8 | #14131A |
| `color.surface` | #FFFFFF | #1E1C26 |
| `color.text` | #1F1B24 | #F3F0F7 |
| `color.textMuted` | #6B6475 | #A9A2B5 |
| `color.success / warning / danger` | #2E9E6B / #D99A21 / #D64545 | #4CC48D / #F0B54A / #F06A6A |
| `radius.card / button / chip` | 20 / 14 / 999 | same |
| `space` scale | 4, 8, 12, 16, 24, 32, 48 | same |
| Font | Inter (UI) + a soft serif for archetype names (e.g. Fraunces), both via bundled assets | same |

Verify every text/background pair against WCAG AA in tests. Core components (build once, use everywhere): `SoulCard` (candidate card), `TierChip`, `ReasonRow`, `ArchetypeBadge`, `Constellation`, `LikertScale`, `ProgressHeader`, `InsightCard`, `LockedSection`, `PaywallSheet`, `ChatBubble`, `StatusPill` (Open to meet), `EmptyState`, `ErrorState`, `OfflineBanner`, `TestVersionBadge` (Alpha only).
