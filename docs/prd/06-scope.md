> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 6. Scope

## 6.0 ALPHA: friends test (build first)
The smallest version that lets friends experience the whole idea on Web/PWA and Android:
1. Invite‑only sign‑up (email code), age gate, consents (ALPHA terms: "test version, data may be reset").
2. **Soul Engine:** Quick Scan → Soul Profile reveal → archetype → DNA card (AI + fallback). Compatibility v2, reasons/frictions.
3. Profile: basics, photos, interests, bio.
4. Today's Souls (with **demo profiles** so the set is never empty, [18 §18.3](18-release-plan.md)).
5. Like/pass, mutual match, chat (realtime), conversation starters.
6. Reports: self report and "You two" pair report, **full and free** (paywall off).
7. Nearby Now with real location + the alpha location simulator (testers only).
8. Block, report, minimal admin queue.
9. In‑app feedback button, Sentry crash reporting, analytics (with consent).
10. Account deletion.
11. Web (responsive + PWA) and Android APK. iOS/desktop builds optional.

Not in ALPHA (but P0 for the closed beta): Deep Personality, Soul Talk (needs approved crisis texts, see [20](20-open-decisions.md). If approved before Alpha, it may be included), payments plumbing, data export, push on web, retention jobs beyond basics.

## 6.1 P0: MVP / closed beta
1. Email code sign‑up/login, logout, session revocation.
2. 18+ age gate, Terms/Privacy, separate optional consents, share level choice.
3. **Soul Engine**: Quick Scan, scoring, Soul Profile, archetype, Deep Personality (120 items in 4 parts), compatibility model v2 with reasons and frictions, engine versioning, recompute pipeline.
4. Personality DNA card (AI + template fallback, review/edit/hide).
5. Profile: name, DOB, gender, interested‑in, intent, bio, 2–6 photos, interests, preferences.
6. Today's Souls daily set.
7. Nearby Now: Open to meet, foreground location, nearby alerts, Yes/No/Later.
8. Like/pass, mutual match, matches list, realtime 1:1 text chat.
9. **Reports:** free self summary, full self report, pair teaser, full pair report (all free during beta via flag).
10. **Soul+ subscription** plumbing: RevenueCat, entitlements, paywall screens, flag OFF in beta.
11. **Soul Talk**: 8 topics, insights, Soul Map, safety, encryption.
12. Block, report, unmatch, automatic protections, admin report queue.
13. Privacy settings, push notifications (no private content on lock screen), account deletion, data export.
14. Privacy‑safe analytics, Sentry, CI, staging.

## 6.2 P1: before public launch
Sign in with Apple/Google · shareable archetype image card · one‑time purchases (pair report, self report) · "Did you meet?" feedback for the engine learning loop · Love & Relationship deep questionnaire (Level 3) · Values deep dive (Level 4) · Soul Talk daily reflection, "Ask about yourself", free talk, voice input (on‑device speech‑to‑text) · selfie verification badge · AI conversation starters in chat (draft only) · perceptual‑hash duplicate photos · image moderation vendor · session list.

## 6.3 P2: later
**Near+** dating perks (see who liked you, incognito, longer Open window, travel mode for the feed only) · boosts · learned ranking model (with consent) · couples mode (for existing couples) · events/venues · Night mode.

## 6.4 NEVER
- Exact coordinates, a live map, or distances more precise than D28.
- Location spoofing for Nearby Now.
- Selling or showing another user's raw answers, Soul Talk content, private insights or anything beyond their chosen share level.
- Paywalling chat, block, report, safety, crisis resources, data export or deletion.
- Ranking or visibility based on payment.
- AI sending messages or replying as the user. An AI companion or romantic AI persona.
- AI analysis of photos to infer personality, ethnicity, religion, health, orientation or attractiveness.
- Clinical labels or diagnoses (e.g. "neurotic", "anxious attachment", disorders), MBTI types, astrology.
- Fake notifications or fake activity ("12 people near you" when there aren't).
- Selling or sharing location, answers or chats with third parties for advertising.

