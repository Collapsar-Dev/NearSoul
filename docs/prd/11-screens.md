> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 11. Screens (mobile)

Navigation: **Today** · **Nearby** · **Soul** (centre) · **Matches** · **Me**. Bottom bar on compact, navigation rail/sidebar on medium and expanded ([05 §5.9](05-ux-and-design.md)). Desktop two‑pane layouts follow §5.9. Every screen must be built for all three breakpoints.

| # | Screen | Key elements | States / rules |
|---|---|---|---|
| S1 | Splash | logo, session check | → Welcome / last onboarding step / Today |
| S2 | Welcome | 3 slides (§7.1), Get started, I have an account | — |
| S3 | Email | field, Continue, Terms link | invalid email |
| S4 | Code | 6‑box input (iOS autofill), resend timer 60 s | wrong, expired, too many attempts |
| S5 | Date of birth | picker, age confirmation | < 18 → S5b blocked |
| S6 | Consents | required Terms/Privacy, optional toggles with one‑line explanations | Continue disabled until required |
| S7 | Quick Scan intro | "6 minutes, no right or wrong answers", what it's for, privacy line | — |
| S8 | Quick Scan item | block title, progress, statement, 5 Likert buttons (or options), Back, Skip | auto‑advance, offline queue, resume |
| S9 | Block interstitial | short fun line + next block title | — |
| S10 | **Soul Profile reveal** | animated constellation → archetype name/illustration → 5 domains with bands and positive text → 3 strengths → Continue | computing (≤ 2 s), low‑confidence notes |
| S11 | DNA card review | card, AI label, Show / Edit / Hide, visibility selector | generating skeleton (≤ 8 s), silent fallback |
| S12 | Share level | 3 options with concrete examples of what a match would see, "You see as deep as you share" | no preselection, Continue after choice |
| S13 | Basics | name, gender, interested in, intent cards | — |
| S14 | Photos | 6‑slot grid, camera/gallery, reorder, delete, min 2 | upload progress, retry, processing |
| S15 | Interests & bio | searchable chips by category, 3–10 counter, bio counter | — |
| S16 | Discovery opt‑in | explanation, On / Not now | — |
| S17 | **Today** | header "Today's Souls · 9 left", cards: photo, name, age, city/band, tier chip, archetype, top reason; ✕ / ❤️, undo pass 5 s | generating, all seen ("New souls at 12:00" + CTAs), empty (honest), like limit |
| S18 | Candidate profile | photos, facts, bio, interests (shared highlighted), archetype, DNA card, "Why you might click", layer breakdown (Soul+ / beta), actions, menu Block/Report | — |
| S19 | Nearby (off) | "Open to meet" button, explanation, safety note | location denied → Settings link |
| S20 | Open to meet setup | duration, radius, activity chips, Start | — |
| S21 | Nearby (on) | status + countdown + Stop, honest waiting animation (no fake counts), Nearby list | waiting state |
| S22 | Nearby card | GEO‑007, Yes / No / Later | window expired → read‑only |
| S23 | Match | both photos, "It's a match!" / "You're both nearby 👋", top shared reason, Say hi, Keep exploring | — |
| S24 | Matches | new matches row, conversations, unread badges | empty with tip |
| S25 | Chat | header (photo, name, "You two" button, menu), pinned teaser (collapsible), messages, starters, input | sending/failed/retry, match ended, safety tip banner |
| S26 | **Pair report "You two"** | sections §9.2, locked sections with titles and counts, "Free during beta" label when applicable | generating, locked → paywall, regenerated notice |
| S27 | **Soul tab home** | archetype header, profile depth ring, constellation, "Go deeper" (Deep part X, suggested Soul Talk topic), Soul Talk topics, Soul Map entry, Self report entry | — |
| S28 | Soul Profile details | domains + facets, layers, edit layer traits, Retake, "Show numbers" (owner only) | low‑confidence hints |
| S29 | Deep Personality | part selector (1–4) with time estimates, same item UI as S8, "New facets unlocked" result | resume |
| S30 | **Self report** | sections §9.2, free summary + locked sections | generating, locked → paywall |
| S31 | Soul Talk intro & consent | is / isn't, privacy, consent | declined → explanation only |
| S32 | Soul Talk session | streaming guide bubbles, user bubbles, chips, input, End, "This isn't therapy" | retry, safety sheet, resume banner, weekly limit (before start only) |
| S33 | Soul Talk wrap‑up | summary, insight cards (Keep / Edit / Discard + visibility), question to sit with | generating, retry |
| S34 | Soul Map | profile summary, insights by category, timeline, per‑insight menu, "Update my card" preview | empty state |
| S35 | Paywall | benefits, locked content preview titles, plans (monthly/yearly), price/period/renewal/cancel text, Restore, Terms/Privacy, Close | purchase pending/failed/success, restore result |
| S36 | Me | profile preview as others see it, completeness, Edit, Soul+ status, Settings | — |
| S37 | Settings tree | ACC‑001 | — |
| S38 | Report | categories → comment → submit, "also block" | confirmation |
| S39 | Delete account | consequences, subscription note, export link, confirm with code | progress, done |
| S40 | Safety centre | tips, block/report how‑to, emergency number | — |
| S41 | Invite code (ALPHA) | code field (pre‑filled from `/invite/{code}`), "Don't have one? Ask the person who shared NearSoul with you" | invalid/used code |
| S42 | Notification centre | list of in‑app notifications (match, message, daily set, nearby, report ready), mark all read | empty |
| S43 | Feedback (ALPHA) | category (bug, idea, confusing, engine felt wrong, other), text, optional screenshot (attached automatically on mobile/web if the user agrees), app version + screen auto‑attached | sent confirmation |
| S44 | About | app version, build number, environment, licences (incl. IPIP attribution), Terms, Privacy | — |
| S45 | Alpha tools (ALPHA, testers only) | location simulator (pick a preset place in the launch city or drop a pin), "Reset my Today's Souls", "Show engine debug" (own scores and the pair score breakdown for a match, testers only) | visible only on `APP_ENV=alpha` with a red "TEST TOOLS" header |

**Global ALPHA UI:** a small `TestVersionBadge` ("TEST") in the app bar on `APP_ENV=alpha`, and a floating "Feedback" button (or Me → Send feedback) on every main screen.

