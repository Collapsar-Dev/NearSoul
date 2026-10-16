> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 7. User flows

## 7.1 First launch → aha → ready to match (target: reveal ≤ 7 min, first candidates ≤ 12 min)
```
Splash → Welcome (3 slides: "Find out who you are in love" / "Meet people who fit you, nearby" /
         "Your location stays private")  [Get started] [I have an account]
→ Email → 6-digit code
→ Date of birth  (under 18 → blocked screen)
→ Consents: Terms & Privacy (required) + optional: product emails, analytics, AI writing
→ Quick Scan intro: "6 minutes. No right or wrong answers."
→ Quick Scan: 4 blocks (How you are · How you love · What matters · How you live), one question per screen,
   progress bar, micro-celebration between blocks, can pause/resume
→ ★ Soul Profile reveal: archetype animation → 5 domain bars with positive texts → 3 strengths
   → "See what this means for dating" → Personality DNA card (review: Show / Edit / Hide)
→ Share level choice: "How much can your matches learn about you in 'You two' reports?"
   Minimal / Standard (recommended) / Deep, with examples. "You see as deep as you share."
→ Basics: first name, gender, interested in, intent
→ Photos (min 2) → Interests (3–10) + bio (optional)
→ Discovery opt-in: "Show me to compatible people?" On / Not now
→ Today's Souls (first set generated immediately)
```
Every step is saved server‑side. Killing the app resumes at the same step.

## 7.2 Daily: Today's Souls
```
12:00 local → (optional push) "Your Today's Souls are ready ✨"
→ Today tab: 15 cards, best first. Card = photo, name, age, city or band, tier chip, top reason, archetype
→ Tap → candidate profile: photos, facts, bio, interests (shared highlighted), archetype, DNA card (if visible),
   "Why you might click" (2–3 reasons + 1 gentle difference)
→ ❤️ Like / ✕ Pass (undo last pass within 5 s)
→ All seen → "That's today's set. New souls at 12:00." + CTAs: Soul Talk, Nearby
```

## 7.3 Nearby Now
```
Nearby tab → "Open to meet"
→ (first time) location explanation → system permission "While using the app"
   denied → explanation + Open Settings; Today and Soul still work
→ Duration (1h / 2h / 4h), radius (500m / 1km / 3km / 10km), optional activity (☕ Coffee, 🚶 Walk, 🍷 Drinks, 💬 Chat)
→ Status pill "Open to meet · 1:42 left" on all tabs, tap to stop
→ Server finds compatible open users nearby → both get an alert "Someone compatible is nearby ✨"
→ Nearby card: photos, name, age, band, activity, tier + reasons → Yes ❤️ / No ✕ / Later ⏳
→ Both Yes → Match screen "You're both nearby 👋" → chat
→ Window ends → status off, Later list cleared, location deleted if the feed doesn't need it
```

## 7.4 Mutual match → "You two" → chat
```
Mutual like → Match screen: both photos, "It's a match!", top shared reason
→ [Say hi] opens chat with "You two" teaser pinned at the top:
     tier · 3 shared reasons · 2–3 lines from their DNA card · 3 conversation starters (free)
     locked sections (titles visible): "Where you might clash (2)", "How to talk to {name}",
     "Your layers side by side", "First date ideas"
→ tap a locked section → (PAYWALL_ENABLED) paywall → purchase → full report
                        (beta) full report opens with label "Free during beta"
→ chat continues normally (never blocked)
```

## 7.5 Self‑discovery: deepen the profile
```
Soul tab → Soul Profile (archetype, domains, layers, confidence meter "Profile depth 40%")
→ "Go deeper" options:
   a) Deep Personality part 1/4 (30 items, ~4 min) → facets unlocked for that domain group
   b) Soul Talk topic (5–10 min conversation) → insights → keep/edit/discard
→ Profile depth increases → "Your matches were updated with your new profile"
→ Full self report: free summary visible; full sections locked behind Soul+ (beta: free)
```

## 7.6 Soul Talk session
```
Soul tab → Soul Talk (first time: intro "self-reflection, not therapy", privacy, AI Self-Discovery consent)
→ Topic → guide's opening question → user answers → guide reflects + asks one follow-up … 6–12 turns
   (risk detected → fixed supportive message + crisis resources, exercise paused)
→ End → summary + 1–5 insights (Keep / Edit / Discard, visibility: Only me / Use for matching / Show on my card)
   + "A question to sit with" → Soul Map updated
```

## 7.7 Purchase (when PAYWALL_ENABLED)
```
Tap locked item → Paywall: what you get (list + preview of locked section titles), price, period,
auto-renewal text, Restore purchases, Terms/Privacy links, Close (always visible)
→ Store purchase sheet → RevenueCat → webhook → server entitlement active
→ locked content loads from the server (never pre-loaded and blurred on the client)
→ Me → Soul+ → Manage subscription (opens store settings)
```

## 7.8 Safety
Profile / card / chat menu → **Block** (instant, confirm dialog) or **Report** (category → optional comment → submit, "also block" ticked by default) → confirmation: "Thanks for telling us. We've hidden this person from you and our team will review it."

## 7.9 Privacy changes
Me → Settings → Privacy: discovery on/off · hide distance · share level (minimal/standard/deep, takes effect on reports generated after the change, existing cached reports regenerated) · DNA card visibility · read receipts · analytics consent · AI consents · Soul Talk data (keep conversations, delete all).

## 7.10 Delete account
Settings → Account → Delete account → what is deleted / kept and how long → confirm with email code → signed out, invisible immediately → deletion job completes (default ≤ 24 h, max 30 days). Active subscription: show "Cancel your subscription in the App Store / Google Play" with a deep link (we cannot cancel store subscriptions ourselves).


## 7.11 Platform notes for flows
- **7.1 on web:** the invite link `/invite/{code}` pre‑fills the invite code. The email code can be pasted. The reveal animation respects reduced motion. After the reveal, desktop users see the DNA card next to the profile (two panes).
- **7.2 on desktop:** two panes (card + full profile). Like/pass with buttons (no single‑key shortcuts).
- **7.3 on web/desktop:** location prompt from the browser after the user taps "Open to meet". If denied or unavailable → explanation "Nearby works best on your phone". Alpha testers can use the location simulator ([18 §18.3](18-release-plan.md)).
- **7.4 on desktop:** chat in the right pane with the "You two" panel beside it at ≥ 1280 px.
- **7.7 on web/desktop:** while the paywall is off (Alpha/beta), no purchase UI appears. P1 Web Billing.
- **Notifications:** every push also creates an in‑app notification (bell), so web/desktop users never miss events.

## 7.12 Edge cases (every flow must handle these)
| # | Situation | Expected behaviour |
|---|---|---|
| E1 | App killed / tab closed mid‑onboarding or mid‑Quick Scan | Resume at the exact step/item on any device after login |
| E2 | Same account on phone and web at once | Both stay signed in (separate sessions). Chat and matches sync in realtime. Quick Scan answers saved per item, so the last write wins per item |
| E3 | Offline while answering | Answers queued locally and sent when online. Offline banner. No data loss |
| E4 | Offline in chat | Message shows "Not sent · Retry". Retry is idempotent |
| E5 | Email code doesn't arrive | Resend after 60 s, "Check spam" hint, support link after 3 tries |
| E6 | Under 18 at DOB step | Blocked screen. No further data collected. Account flagged |
| E7 | User skips many Quick Scan items | Profile computed with low confidence and "Answer a few more" hints. Too few answers in a domain → "Not enough answers yet" |
| E8 | AI unavailable / budget exhausted | DNA card and reports use templates silently. Soul Talk shows "resting" |
| E9 | No candidates in Today's Souls | Fallback widening ([08 ENG‑014](08-soul-engine.md)), then an honest empty state with CTAs. In Alpha, demo profiles fill gaps |
| E10 | Both users like each other at the same moment | Exactly one match, both see the match screen |
| E11 | Match is blocked/unmatched while the other is typing | Send fails with "This conversation has ended". Chat becomes read‑only, then disappears |
| E12 | Location permission denied / GPS off / inaccurate (> 500 m) | Nearby explains why and how to fix. Everything else works |
| E13 | Open to meet expires while the app is closed | Server ends it. On next open the status shows ended. Later list cleared |
| E14 | User changes share level | Cached pair reports regenerated at the next open. Teaser updates |
| E15 | User retakes Quick Scan | Profile, archetype, card (asks before overwriting user edits), daily set from the next day, pair caches invalidated |
| E16 | Photo upload fails / unsupported format / too large | Clear error per photo, retry, others unaffected |
| E17 | Session expired / refresh token reused | Signed out with "Please sign in again". Reuse → all sessions revoked + security email |
| E18 | Account suspended by moderation | Signed out, neutral message with appeal email |
| E19 | Deleted account appears in someone's chat | Shown as "Deleted user", read‑only |
| E20 | Very slow network | Skeletons, no double submits, timeouts with retry |
| E21 | Browser without WebSocket (rare) / proxy blocks it | REST polling fallback every 10 s |
| E22 | Alpha data reset announced | Banner 48 h before. After reset, testers sign in again with the same email |
