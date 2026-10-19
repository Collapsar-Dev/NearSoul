# NearSoul — Product Requirements Document v4.0 (Production)

**Platforms:** iOS and Android apps · Desktop web · Mobile web (PWA)
**Status:** Draft for founder approval · **Date:** 2026-10-19 · **Owner:** Founder (product), engineering lead (delivery)
**Supersedes for production planning:** PRD v3.1 (`docs/prd/`) + change requests CR-1…CR-34 (`docs/prd-change-requests.md`). v3.1 stays the historical spec. This document is the single reference for the production release.
**Live alpha:** https://nearsoul-alpha-y6qr.onrender.com (test version, sign-in codes on screen)

> How to read: §1–§5 are the "why" and "for whom" (product, business). §6–§8 cover platforms and scope. §9 holds the functional requirements with IDs and acceptance criteria. §10–§17 are the "how well" (engine, money, quality, security, operations). §18–§22 cover launch, risks and open decisions. Requirement IDs (e.g. `MATCH-004`) are stable and must be used in tickets, commits and tests.

---

## Table of contents
1. Executive summary
2. Problem, opportunity and market
3. Goals, non-goals and success metrics
4. Users, personas and jobs to be done
5. Product principles
6. Platforms: mobile apps, desktop web, mobile web
7. Release scope (Production 1.0, 1.x, later, never)
8. Information architecture and navigation
9. Functional requirements
10. Soul Engine (matching science)
11. Monetization
12. Non-functional requirements
13. Security and privacy
14. Architecture and infrastructure for production
15. Data model and API overview
16. Analytics and dashboards
17. Trust, safety and operations
18. Legal and store compliance
19. Quality assurance and device matrix
20. Launch plan and go/no-go
21. Risks and mitigations
22. Open decisions
23. Appendices (glossary, screen inventory, change-request map, alpha → production delta)

---

## 1. Executive summary

**NearSoul** is a psychology-driven dating app. Its core, the **Soul Engine**, learns who you are from short, scientifically grounded questions (Big Five personality via public-domain IPIP items + values, relationship style, lifestyle and communication). It then shows a small daily set of people whose character and values fit yours, explains **why** you might click (a rounded match percent plus reasons), and lets you meet compatible people nearby without ever exposing your exact location.

**Tagline:** *Get to know yourself. Discover someone compatible.* (RU: *Узнай себя. Найди близкую душу.*)

**What makes it different**
| Differentiator | Why it matters |
|---|---|
| Science-based matching with explanations | Competitors match on photos and distance; users don't know why they fit |
| Self-discovery as a product (soul type, reports, "Get to know yourself" breaks) | Value even before the first match; retention when matches are few |
| Viral "Check our compatibility" link and story card | Organic growth with Gen Z (share to Instagram/TikTok/Telegram) |
| Privacy-first proximity (distance bands, approximate map for matches only) | Safety for women, the scarcer side of every dating market |
| Quality over quantity (daily set, Hinge-style outcomes) | The only segment of the market that is growing (Hinge +26% revenue in 2025 while Tinder −4%) |

**Production 1.0 goal:** launch in the first city (Yerevan, Armenia; diaspora and EU next) on **iOS, Android, desktop web and mobile web** with real email/social sign-in, verified photos, moderation, paid tiers through the stores and web billing, and all alpha-only shortcuts removed.

---

## 2. Problem, opportunity and market

### 2.1 Problem
- Swipe apps judge by photos; users swipe hundreds of times and get shallow chats.
- People have nothing meaningful to open a conversation with and no idea whether they fit.
- Personality features in dating apps are gimmicks (astrology, MBTI) without a scientific base.
- Proximity apps leak location (exact distance → trilateration) or show everyone to everyone.
- In small markets (Armenia) local apps suffer from fake profiles, aggressive paywalls and stale products.

### 2.2 Market snapshot (Oct 2026)
| Data point | Value | Source |
|---|---|---|
| Global dating app revenue 2025 | ≈ $6B, first year of decline | industry reports |
| Match Group 2025 | $3.5B revenue (flat); Tinder $1.86B (−4%), 8.8M payers (−8%), MAU −9%; Hinge $691M (+26%), 1.9M payers (+17%), revenue per payer $32.96/month | Match Group Q4 2025 remarks |
| Bumble 2025 | $966M revenue (−10%), 3.7M payers | Bumble FY2025 |
| Armenia internet users | 2.36M (80%) | DataReportal 2026 |
| Armenia dating-app audience | ≈ 114k, 79% male, 42% aged 25–34, 93% Android | Start.io estimate |
| Armenia Google Play top dating apps | Tinder, Bumble, OmeTV, Badoo, Pure, happn, Boo | Similarweb, 16 Oct 2026 |
| Local competitors | Barev (largest, aggressive paywall), Ari/Armroom (diaspora, curated), LavashLove, Jan, Kyank | App stores |

### 2.3 Opportunity
1. **Quality dating is the growth segment.** Hinge's model (limited curated sets, outcome focus, high revenue per payer) is the only one growing. NearSoul is that model plus real psychometrics.
2. **Small markets are under-served.** No local app combines science, privacy and modern design.
3. **Diaspora** (US, Russia, France) is a high-paying audience that wants Armenian-culture matching.
4. **Self-discovery content travels.** "What's your soul type?" and "How compatible are we?" are shareable, so acquisition is close to free.

### 2.4 Positioning
"Dating by compatibility of character and values — by science, not by photos and not by the stars."

---

## 3. Goals, non-goals and success metrics

### 3.1 Goals for Production 1.0 (first 6 months after launch)
| # | Goal | Measure |
|---|---|---|
| G1 | Real connections, not swipes | **North Star: weekly "Sparks"** = matches that reach ≥ 6 messages (3 each way) |
| G2 | Fast, delightful onboarding | ≥ 70% of sign-ups finish the 10 questions and see Today's Souls |
| G3 | Healthy two-sided market | ≥ 40% women among weekly actives in the launch city |
| G4 | Organic growth | K-factor ≥ 0.3 from compatibility links and story cards |
| G5 | Trust | ≥ 50% of actives photo-verified; < 1% of actives reported per week; 100% urgent reports handled < 1 h |
| G6 | Sustainable revenue | 5–8% of MAU paying; blended revenue per payer ≥ €7/month |
| G7 | Quality on every platform | Crash-free sessions ≥ 99.5% (mobile), web p75 LCP ≤ 2.5 s, store rating ≥ 4.5 |

### 3.2 Guardrail metrics (must not get worse)
Block/report rate per match · women's day-7 retention · unsubscribes from push · refund rate · time-to-first-match for new women (target < 48 h) · moderation backlog.

### 3.3 Non-goals for 1.0
- No group chats, video calls, voice notes or stories feed inside the app.
- No AI companion, no AI writing messages for users, no AI photo analysis.
- No ranking or visibility boosts sold for money (no "boosts", no "super likes" that change ranking).
- No public social network (followers, likes on posts).
- No background location tracking.

---

## 4. Users, personas and jobs to be done

| Persona | Who | Wants | Fears | Key features |
|---|---|---|---|---|
| **Deep-seeker Ani** (27, Yerevan) | Wants a serious relationship | People with matching values, real conversations | Wasting time, shallow chats | Daily set, match %, reasons, starters, "You two" report |
| **Careful Kate** (often women) | Privacy-conscious | Control over visibility and location | Being found, harassment | Distance bands, approximate map for matches only, verification, block/report, hide from discovery |
| **Curious Gen Z Davit** (21, student) | Loves tests and sharing | Know his type, compare with friends/crush | Boring long forms | 10 questions, soul type, story card, compatibility links |
| **Busy Aram** (33, IT) | Little time | A few great candidates a day | Endless scrolling | Today's Souls, Gold/VIP, write first |
| **Diaspora Mariam** (30, Los Angeles) | Armenian partner abroad | Culture-aware matches, travel mode | Small local pool | Wider radius, Armenian prompts (1.x), multi-city |

**Jobs to be done**
1. "When I'm tired of swiping, help me meet a few people who actually fit me, and tell me why."
2. "When I match, give me something real to start the conversation."
3. "When I'm out, tell me if someone compatible is nearby, without revealing where I am."
4. "When I'm curious about myself, show me who I am in a way I want to share."
5. "When something feels wrong, let me block, report and feel safe."

**Core loops**
- *Daily loop:* notification at 12:00 → Today's Souls → like/pass → match → chat.
- *Self-discovery loop:* 10 questions → soul type → refine profile → better matches → "Get to know yourself" break every 50 people.
- *Viral loop:* story card / link → friend answers 10 questions → sees compatibility → creates own link.
- *Nearby loop:* Open to meet → private alert → mutual yes → meet.

---

## 5. Product principles
1. **Understanding first.** Every screen helps people understand themselves or each other.
2. **Science, honestly framed.** "Helps you understand", never "finds your soulmate". No clinical labels, no MBTI, no astrology.
3. **Consent and reciprocity.** You see as deeply about others as you allow others to see about you (share levels).
4. **Privacy by design.** Never expose exact location, answers, raw scores or private content.
5. **Safety is core.** 18+, verification, block, report, moderation, crisis handling. Chat and safety are never paywalled.
6. **Honest AI.** AI only writes prose around engine results. Deterministic code decides scores, filters and access.
7. **No dark patterns.** No fake activity, countdown paywalls or guilt streaks. Cancel and delete are always easy.
8. **Quality over quantity.** Limited daily sets; payment never changes ranking.
9. **One codebase, native feel.** Flutter everywhere, but each platform follows its own conventions (§6).

---

## 6. Platforms: mobile apps, desktop web, mobile web

### 6.1 Platform strategy
One Flutter codebase (`apps/app`) builds **iOS**, **Android**, **web** (desktop + mobile, installable PWA) and optionally Windows/macOS/Linux. One NestJS API serves all clients. Feature logic is never duplicated per platform; platform differences live behind interfaces in `lib/core/platform/` (storage, push, location, image, share, social sign-in, purchases).

| Platform | Distribution | Production 1.0 | Primary role |
|---|---|---|---|
| **Android app** | Google Play (internal → closed → open testing → production, staged rollout) | **Required** | Main platform in Armenia (93% Android) |
| **iOS app** | App Store (TestFlight → phased release) | **Required** | Diaspora, EU, premium segment |
| **Mobile web / PWA** | URL, "Add to Home Screen" | **Required** | Zero-install entry from links, stories, ads; compatibility checks |
| **Desktop web** | URL | **Required** | Long sessions, chat at the computer, reports, admin |
| Windows / macOS / Linux native | CI artifacts | Optional (later, signed) | Not needed: desktop web covers it |

### 6.2 Capability matrix
| Capability | iOS / Android app | Mobile web (PWA) | Desktop web |
|---|---|---|---|
| Sign-in: email code | ✓ | ✓ | ✓ |
| Sign in with Apple | ✓ native (`sign_in_with_apple`) — **mandatory on iOS** when any social login exists | ✓ Apple JS popup | ✓ Apple JS popup |
| Sign in with Google | ✓ native (`google_sign_in` / Credential Manager) | ✓ popup (OpenID id_token) | ✓ popup |
| VK ID | ✓ VK ID SDK | ✓ OAuth 2.1 + PKCE popup | ✓ popup |
| Onboarding, 10 questions, soul profile | ✓ | ✓ | ✓ |
| Photo upload | Camera + gallery, native crop | File picker / camera capture; HEIC → JPEG in browser | File picker + drag & drop |
| Selfie verification | Front camera (in-app capture) | `capture="user"` camera input | Webcam via file picker; prompt "use your phone" if no camera |
| Today's Souls (cards + list) | Swipe gestures, haptics | Swipe gestures | Grid 2–3 columns, buttons, no single-key like/pass |
| Chat (realtime) | ✓ | ✓ | ✓ two-pane (list + conversation) |
| Push notifications | FCM (Android), APNs via FCM (iOS) | Web Push (Chrome/Edge/Firefox/Android); iOS only for installed PWA (16.4+) | Web Push |
| In-app notification centre | ✓ (source of truth everywhere) | ✓ | ✓ |
| Nearby / location | Foreground "while using" permission | Browser geolocation (HTTPS, user tap) | Browser geolocation; low-accuracy desktops are rejected (> 500 m) with an explanation |
| Matches map | ✓ | ✓ | ✓ |
| Share story card / link | Native share sheet (`share_plus`) incl. Instagram Stories | Web Share API with files; download fallback | Download image + copy link |
| Purchases | Store in-app purchase via RevenueCat | RevenueCat Web Billing (Stripe) | RevenueCat Web Billing (Stripe) |
| Deep links | Universal Links / App Links (`/c/{code}`, `/matches/{id}`, `/invite/{code}`) | Path URLs | Path URLs |
| Offline | Cached last screens, queued messages, offline banner | Offline screen (service worker shell) | Offline screen |
| App lock (Face ID / fingerprint) | 1.x | — | — |
| Screenshot protection in chat | P2 (Android `FLAG_SECURE` option) | — | — |

### 6.3 Mobile apps (iOS and Android) — requirements
| ID | Requirement | Acceptance criteria |
|---|---|---|
| MOB-001 | Native builds from the Flutter codebase with platform folders; bundle id `app.nearsoul` (rename from the current `app.nearsoul.nearsoul` before first store upload) | Signed AAB and IPA built in CI; versionName/CFBundleShortVersionString = semver, build number = CI run |
| MOB-002 | Secure token storage in Keychain / Android Keystore (`flutter_secure_storage`) | No tokens in shared preferences or logs; refresh rotation works after app restart |
| MOB-003 | Native push: FCM on Android, APNs through FCM on iOS; permission asked after the first meaningful moment (first match or turning on Nearby), never at first launch | Push opens the right screen (deep link); lock-screen text never contains message content or names |
| MOB-004 | Native social sign-in: Apple (iOS required, Android optional), Google (Credential Manager), VK ID SDK; same server endpoint `/v1/auth/social/{provider}` | Server verifies tokens (§9.1); cancelling returns to the welcome screen without an error |
| MOB-005 | Camera flows: photo capture with crop, selfie verification with front camera and pose overlay | Works on low-end Android (2 GB RAM); images re-encoded server-side |
| MOB-006 | Universal Links / App Links for `https://<domain>/c/*`, `/matches/*`, `/invite/*`, `/me/*`; `apple-app-site-association` and `assetlinks.json` served by the API | Tapping a compatibility link with the app installed opens the app at the check screen; without the app opens mobile web |
| MOB-007 | In-app purchases through RevenueCat (StoreKit 2 / Play Billing 7+), restore purchases, manage subscription link | Sandbox purchase, renewal, cancel and restore pass on both stores; entitlements come only from the server |
| MOB-008 | Forced/optional update: `/v1/config` returns `minSupportedVersion` and `latestVersion` per platform | Below minimum → blocking update screen with store link; below latest → dismissible banner |
| MOB-009 | Haptics on like, match and verification success (respecting system settings) | — |
| MOB-010 | Performance: cold start ≤ 2.5 s on mid-range devices, 60 fps swipe, app size ≤ 40 MB download | Measured in release builds on the device matrix (§19) |
| MOB-011 | Accessibility: VoiceOver/TalkBack labels, dynamic type to 200%, reduced motion | Audit passes on key flows |
| MOB-012 | No tracking SDKs; no App Tracking Transparency prompt needed. Privacy nutrition label / Data safety form filled from §13 | Store review passes |
| MOB-013 | Account deletion in-app (Apple 5.1.1(v)) and a web page for deletion requests (Google Play) | Deletion completes within 30 days; confirmation email |
| MOB-014 | Android back button and iOS swipe-back behave natively; bottom navigation with 5 tabs | — |
| MOB-015 | Local notifications are not used for marketing; notification channels on Android: Matches, Messages, Daily, Nearby, Safety | User can mute each channel |

### 6.4 Desktop web — requirements
| ID | Requirement | Acceptance criteria |
|---|---|---|
| WEB-001 | Expanded layout ≥ 1024 px: left navigation with labels, 3-column Today grid, two-pane Matches (list + chat), map full width | Verified at 1440×900 and 1920×1080 |
| WEB-002 | Full keyboard support: Tab order, visible focus, Enter sends, Shift+Enter new line, Esc closes dialogs; like/pass never bound to single keys | Keyboard-only walkthrough passes |
| WEB-003 | Hover states, visible scrollbars, selectable chat text, drag & drop photo upload | — |
| WEB-004 | Auth: refresh token in httpOnly Secure SameSite=Strict cookie; access token in memory; CSRF header on refresh | Security test (§13) |
| WEB-005 | Web Billing (RevenueCat + Stripe) for Soul+/Gold/VIP with the same entitlements as mobile | Purchase on web unlocks the same features on mobile and vice versa |
| WEB-006 | Web Push via VAPID with a settings toggle | Delivered on Chrome, Edge, Firefox |
| WEB-007 | Admin panel at `/admin` (desktop only) with TOTP | §17 |

### 6.5 Mobile web (PWA) — requirements
| ID | Requirement | Acceptance criteria |
|---|---|---|
| MWEB-001 | Compact layout < 600 px: bottom navigation, full-height card stack, safe-area insets | Verified at 360×740, 390×844, 412×915 |
| MWEB-002 | Installable PWA: manifest, icons (incl. maskable), standalone display, offline shell; "Install app" hint once on the second visit | Lighthouse PWA installable |
| MWEB-003 | Soft keyboard never covers inputs (chat, email, code); forced accessibility semantics only on desktop | Tested on Chrome Android and Safari iOS |
| MWEB-004 | Camera capture for photos and selfie; HEIC/large photos converted to JPEG in the browser | iPhone HEIC upload works |
| MWEB-005 | Smart app banner / "Open in app" when the native app is installed; compatibility links work fully on web without install | — |
| MWEB-006 | Performance budget: first meaningful paint ≤ 2 s on 4G (branded HTML splash appears immediately), app interactive ≤ 4 s; renderer chosen by measurement (CanvasKit vs skwasm) | p75 field data |
| MWEB-007 | iOS Safari: Web Push only after "Add to Home Screen"; the app explains this in Settings | — |

### 6.6 Responsive breakpoints (all web and tablet apps)
| Size class | Width | Navigation | Today | Matches |
|---|---|---|---|---|
| Compact | < 600 | Bottom bar | Single card stack / single-column list | List → chat |
| Medium | 600–1023 | Navigation rail | 2-column grid | List + chat side by side |
| Expanded | ≥ 1024 | Sidebar with labels | 3-column grid | List + chat |

Every screen must provide loading, empty, error, offline and permission-denied states.

---

## 7. Release scope

### 7.1 Production 1.0 (launch) — "P0"
1. Sign-in: email code (real email provider), Apple, Google, VK ID; sessions; account deletion; data export.
2. Onboarding: age gate 18+, consents, 10 starter questions, soul reveal, basics, ≥ 1 photo, interests (skippable), discovery opt-in.
3. Soul Engine: Quick Scan scoring, soul type (archetype), soul profile, refine questions, Deep Personality (116 items), compatibility v2 with reasons/frictions.
4. Profile: edit, photos (1–6), interests, job, height, bio, prompts (1.x for Armenian prompts).
5. Photo verification (selfie + pose, moderator review), blue check.
6. Today's Souls: daily set (15 free / 25 / 50 / unlimited), cards + list, swipe, "Get to know yourself" break every 50, refill rule, ads every 10 for Free/Soul+.
7. Likes, matches, full-screen match moment with mini report and starters, chat (realtime, read receipts, safety), unmatch.
8. "Liked you" (count free, list Gold+), rewind (Gold+), write first (VIP, 5/day).
9. Nearby Now (Open to meet, alerts) and Matches map (approximate area, opt-in, matches only).
10. Compatibility check by link + story card ("How compatible are we?").
11. Reports: self report and "You two" report (teaser free, full paid).
12. Personas: up to 3 profiles per account (decision D-3 in §22 may limit this for production).
13. Monetization: Soul+, Gold, VIP via stores and web billing; partner ad cards with locations.
14. Notifications: in-app centre, push on all platforms, quiet hours, per-type toggles.
15. Safety: block, report, moderation queue, verification queue, automatic protections, crisis resources (if Soul Talk on).
16. Settings: theme (Auto/Light/Dark), palettes, logo choice, language (RU/EN; HY in 1.x), privacy toggles.
17. Admin panel with TOTP, audit log, metrics.
18. Analytics with consent; crash reporting.

### 7.2 Production 1.x (within 3 months)
Armenian language (HY) across UI and questions · Armenian culture prompts · Soul Talk (AI self-reflection) once crisis texts are approved · native app lock · automated face-match vendor for verification · "Did you meet?" outcome feedback · Love & Values deep questionnaires · travel mode (feed only) · referral rewards (free Soul+ week) · landing pages for SEO.

### 7.3 Later (P2)
Events with partner venues · couples mode · learned ranking (with consent) · incognito mode · desktop native apps signed · video profile clips (moderated).

### 7.4 Never
Exact coordinates or a live map for non-matches · location spoofing in production · selling or showing raw answers, Soul Talk or private insights · paywalling chat, block, report, safety, crisis resources, export or deletion · ranking by payment · AI writing as the user, AI companions · AI photo analysis for personality/ethnicity/religion/health/orientation/attractiveness · clinical labels, MBTI, astrology · fake notifications or activity · selling data for advertising.

---

## 8. Information architecture and navigation

**Tabs (all platforms):** Today · Nearby · Soul · Matches · Me.

```
Welcome ─ Sign in (Apple / Google / VK / Email → Code)
   └─ Onboarding: Age → Consents → 10 questions → Soul reveal → Share level → Basics → Photos → Interests → Discovery
Today      ── Card / List ── Profile ── Write first (VIP)
           └─ Ad card · "Get to know yourself" break · Refine questions
Nearby     ── Open to meet ── Nearby list ── Matches map
Soul       ── Soul profile ── Compatibility card → Story card / Share link / Who checked
           └─ Refine questions · Deep Personality · Self report · Soul Talk (1.x)
Matches    ── New matches row · Requests (write first) · Liked you · Conversations ── Chat ── "You two" report
Me         ── Profiles (personas) · Edit · Photos · Verify photos · Interests
           ── Subscription · Settings · Notifications · Blocked · Safety centre · Invite friends · Feedback · About · Delete account
Deep links ── /c/{code} (compatibility) · /invite/{code} · /matches/{id} · /today/profile/{id}
```

**URL routes (web and deep links):** `/welcome`, `/auth/email`, `/auth/code`, `/onboarding/*`, `/today`, `/today/profile/:id`, `/nearby`, `/nearby/map`, `/soul`, `/soul/report`, `/matches`, `/matches/:id`, `/matches/:id/report`, `/me/*`, `/c/:code`, `/invite/:code`. Refreshing any URL restores the screen after an auth check; unauthorised URLs return to the target after sign-in.

---

## 9. Functional requirements

Priority: **P0** = Production 1.0, **P1** = 1.x, **P2** = later. Every requirement needs automated tests; privacy and permission rules always have integration tests.

### 9.1 Authentication and accounts (AUTH)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| AUTH-001 | P0 | Email one-time code: 6 digits, 10 min validity, 5 attempts, resend after 60 s, max 3 codes/15 min per email, 10 code requests/h and 30 verifications/h per IP; only the latest code is valid; codes stored hashed | Brute-force test fails; expired/used codes rejected |
| AUTH-002 | P0 | Real email delivery (Brevo or Resend) with verified sender domain (SPF, DKIM, DMARC); on-screen codes impossible in staging/production (server refuses to start) | Startup check test; delivery < 30 s p95 |
| AUTH-003 | P0 | Sessions: access JWT 15 min; opaque refresh token 30 days, rotated on every use, stored hashed; reuse of a rotated token revokes the whole family; logout and logout-all | Reuse test revokes family |
| AUTH-004 | P0 | Sign in with Apple, Google, VK ID → `POST /v1/auth/social/{provider}`; ID tokens verified against provider keys (signature, issuer, audience, expiry, nonce); VK code exchanged server-side with PKCE; accounts linked or created **only by a verified email**; identities in `auth_identities` | Forged signature, wrong audience/issuer, expired token, wrong nonce and unverified email are rejected |
| AUTH-005 | P0 | Invite-only mode (`INVITE_ONLY`) for closed beta; invite codes from admin and from users | New account without valid invite refused when on |
| AUTH-006 | P0 | Account deletion: confirm with a fresh code or provider re-auth; immediate hide, hard delete ≤ 30 days; deleting the owner deletes all personas; web deletion page | Deleted user can't sign in; data purged by job |
| AUTH-007 | P0 | Data export (zip of own data, link valid 24 h) | Export contains profile, answers, messages sent, consents |
| AUTH-008 | P1 | Passkeys on web and mobile | — |

### 9.2 Onboarding and consent (ONB)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| ONB-001 | P0 | Age gate: date of birth required, 18+ enforced server-side, cannot be changed later; under-18 → blocked state | Under-18 can't proceed or retry with another date |
| ONB-002 | P0 | Consents: Terms + Privacy (versioned), optional separate consents (AI writing, analytics); production terms replace alpha terms | Consent records with version and timestamp |
| ONB-003 | P0 | 10 starter questions (one per Big Five domain + values, kids, weekends, texting rhythm, closeness), individually skippable; completion screen "First stage done!" | ≥ 70% completion target; skipped items excluded from scoring |
| ONB-004 | P0 | Soul reveal: archetype, strengths, depth; share level choice (minimal/standard/deep, default standard) — skippable | — |
| ONB-005 | P0 | Basics: first name, gender, interested in, intent, city, age range (default own age ±5), optional job/height/bio | Name validation (letters, 1–30) |
| ONB-006 | P0 | Photos: ≥ 1 required (max 6) | Can't finish without a photo |
| ONB-007 | P0 | Interests (0–10, skippable) and discovery opt-in final step ("Start meeting people" / "Not yet") | — |
| ONB-008 | P0 | Resume onboarding at the right step on any device | — |

### 9.3 Profile and photos (PROF)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| PROF-001 | P0 | Public profile DTO allowlist only: id, first name, age, photos (signed URLs), bio, intent, job, height, city or distance band, interests (with "shared"), archetype, personality card (if visible), compatibility (percent, tier, ≤ 3 reasons), verified, activity | Contract test fails on any extra field |
| PROF-002 | P0 | Photo upload: magic-byte check, ≥ 400×400, ≤ 10 MB, re-encode to WebP (strips EXIF/GPS), private storage, signed URLs (10 min), banned-hash list | EXIF GPS test |
| PROF-003 | P0 | Edit profile, reorder/delete photos (can't delete the last photo while discoverable) | — |
| PROF-004 | P0 | Personality card (template; AI-written when enabled) with review/edit/hide and visibility (everyone / matches only / hidden) | — |
| PROF-005 | P1 | Prompts incl. Armenian culture prompts ("Favourite place in Yerevan", "Dolma or khorovats?") | — |

### 9.4 Photo verification (VERIFY)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| VERIFY-001 | P0 | Selfie with today's random pose (✌️ 👍 🤟 👋 ear, chin); stable per user per day | Wrong pose rejected |
| VERIFY-002 | P0 | Moderator compares selfie with profile photos in admin («Photo checks»), approves or rejects with a reason (not matching, pose missing, unclear, not a person) | Audit log entry per decision |
| VERIFY-003 | P0 | Selfie never shown to users and deleted on decision; no face templates/biometrics; 3 attempts/day; requires a profile photo | Storage key null after decision |
| VERIFY-004 | P0 | Blue check on cards, profiles, Me; notification on result | — |
| VERIFY-005 | P1 | Automated face-match vendor (liveness) behind the same API; moderator as fallback | Vendor DPA signed; biometric consent where required |
| VERIFY-006 | P1 | Re-verification required when all photos are replaced | — |
| VERIFY-007 | P1 | "Verified only" filter in discovery settings | — |

### 9.5 Today's Souls — discovery (DISC)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| DISC-001 | P0 | Daily set generated per user per local day, refreshed at 12:00 local; stable order during the day | Same order on refresh |
| DISC-002 | P0 | Size by tier: Free 15, Soul+ 25, Gold 50, VIP unlimited (cap 500); upgrade tops up the same day | Integration test per tier |
| DISC-003 | P0 | Eligibility before scoring (§10.3); widen age by +2/+4 years when flexible; refill: when the pool is small, people shown earlier but never liked/passed return after all new people | Liked/passed people never repeat |
| DISC-004 | P0 | Paging: `GET /v1/daily-set?offset&limit` (pages of 30); counters total / acted / remaining | — |
| DISC-005 | P0 | Card view with swipe (right like, left pass), tilt/stamp, photo flip by tapping thirds, buttons ✕ ⓘ ✉ ♥; list view (1/2/3 columns) remembered per device | Keyboard and screen-reader accessible |
| DISC-006 | P0 | Card shows match percent (rounded to 5), 2 reasons, archetype, verified badge, demo/test badges never in production | — |
| DISC-007 | P0 | "Get to know yourself" break card after every 50 people (Take it / Skip) while refine questions remain | — |
| DISC-008 | P0 | Empty states explain why (hidden from discovery, no photo, too many skipped answers, no one new) with one-tap fixes | — |
| DISC-009 | P0 | Daily nudge to refine the profile (once per day, after 3 cards) | — |
| DISC-010 | P1 | Travel mode: browse another city's set (feed only, no nearby) | — |

### 9.6 Likes, matches and the match moment (MATCH)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| MATCH-001 | P0 | Like/pass idempotent; like allowed only for reachable people (daily set within 3 days, nearby alert, Liked-you for Gold+, write-first) | Unreachable like → 404 |
| MATCH-002 | P0 | Daily like limit = daily set size of the tier | 429 `LIKE_LIMIT` with reset time |
| MATCH-003 | P0 | Mutual like creates exactly one match (unique pair, race-safe) and notifies both (push + realtime) | Concurrency test |
| MATCH-004 | P0 | **Full-screen match moment**: both photos, percent, mini "you two" report (their soul type + 3 reasons → full report), 3 conversation starters; tapping a starter opens the chat with the text in the box (user sends) | Opens over navigation on all platforms |
| MATCH-005 | P0 | Liked you: count for everyone, list + like back for Gold+ | — |
| MATCH-006 | P0 | Rewind last pass within 24 h (Gold+) | — |
| MATCH-007 | P0 | Write first (VIP): 5/day, recipient sees a request, can view profile, accept (match + chat with the message) or decline; contact info blocked in first messages; counts as a like | — |
| MATCH-008 | P0 | Unmatch ends the chat for both; previous matches never shown again in discovery | — |

### 9.7 Chat (CHAT)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| CHAT-001 | P0 | 1:1 text chat, realtime over WebSocket with REST fallback/polling, client message ids (dedupe), read receipts (toggle) | Message order and dedupe tests |
| CHAT-002 | P0 | Conversation starters from shared reasons when a chat is empty | — |
| CHAT-003 | P0 | Safety: no links/phone numbers/social handles in the first messages until both have replied; report a message; block from chat | — |
| CHAT-004 | P0 | Message bodies never in logs, analytics or push payloads | Log scan test |
| CHAT-005 | P1 | Photo messages (moderated), reactions | — |
| CHAT-006 | P1 | "Did you meet?" prompt after 7 days of active chat (outcome signal) | — |

### 9.8 Nearby and the matches map (GEO)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| GEO-001 | P0 | Location only in the foreground with a pre-permission explanation; stored as the latest H3 res 9 cell centre (≈ 175 m), no history, deleted after 24 h or when not needed; accuracy > 500 m rejected; speed > 300 km/h flagged; 30 updates/h | No raw coordinates stored/logged |
| GEO-002 | P0 | Open to meet: 60/120/240 min, radius 500 m/1/3/10 km, max 3 sessions/day; server is the source of truth for expiry | Clock manipulation test |
| GEO-003 | P0 | Nearby matcher: both open, both fresh (≤ 15 min), within min radius, eligible both ways, compatibility ≥ 55, no alert for the pair in 7 days; one private alert each after 0–3 min random delay; max 5 per window | Exactly one alert each |
| GEO-004 | P0 | Distance only as bands (under 500 m, under 1 km, 1–3 km, 3–10 km, 10+ km) or "Nearby" when hidden; no coordinates/cell ids/metres to other users | Contract + trilateration tests |
| GEO-005 | P0 | **Matches map**: you + matches who turned on "Show me to my matches" (1 h / 4 h / until off); others see the H3 res 8 centre (≈ 460 m) and distance rounded to 100 m; strangers never on the map; block/unmatch/expiry removes immediately; spots older than 6 h hidden | Map e2e tests |
| GEO-006 | P0 | Map tiles from a commercial provider (MapTiler/Stadia/Mapbox) or self-hosted tiles through the API proxy `/v1/tiles` with caching; OSM attribution | No user IPs to the tile provider |

### 9.9 Compatibility check by link (CHECK)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| CHECK-001 | P0 | Personal link `/c/{code}` (8 chars) per user, stable | — |
| CHECK-002 | P0 | Story card 9:16 (soul type, 3 strengths, "How compatible are we? 👀" + link), shared via native share sheet / Web Share / download | Renders identically on all platforms |
| CHECK-003 | P0 | Anyone 18+ who answered the 10 questions can check (onboarding need not be finished); result: one rounded percent, 3 varied reasons, "N more in common", both archetypes; same result for both people | No answers, scores or layer data in the response |
| CHECK-004 | P0 | Never creates a match or chat; blocks respected; own link refused; 20 checks/day; owner notified once per person; "Who checked" list | — |
| CHECK-005 | P0 | Signed-out visitors keep the link through sign-up; the check opens right after the 10 questions | — |

### 9.10 Reports (RPT)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| RPT-001 | P0 | Self report: archetype, domains, values, relationship style, needs, growth edges, reflection questions; free summary, full for Soul+ | — |
| RPT-002 | P0 | "You two" pair report per match: teaser free (reasons, starters, card lines); full for Soul+ (all reasons, frictions with constructive lines, tips, first-date ideas) | Locked data never sent to the client |
| RPT-003 | P0 | Share-level reciprocity: what you see about the other is limited by both share levels | Reciprocity tests |
| RPT-004 | P1 | AI-written report prose (Anthropic) layered on deterministic codes; template fallback | AI never changes codes or access |

### 9.11 Soul Talk — AI self-reflection (SOUL) — P1
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| SOUL-001 | P1 | 8 guided topics, ≤ 20 turns per session, insights proposed at the end; insights affect traits only after the user taps Keep | — |
| SOUL-002 | P1 | Data class S3: app-level encryption with per-user keys (crypto-shred on delete), owner-only, no admin access, no logging, transcripts deleted after 90 days unless kept | No-plaintext test |
| SOUL-003 | P1 | Safety classifier + keyword backup (RU/EN/HY); on risk a fixed approved crisis message with country hotlines; release-blocking eval set at 100% | Crisis eval 100% |
| SOUL-004 | P1 | Soul Map: kept insights by category, timeline | — |

### 9.12 Personas (PERSONA)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| PERSONA-001 | P0* | Up to 3 fully separate profiles under one sign-in; age/consents inherited and locked; profiles of one person never meet; a block covers all; suspension and deletion cover all; tier shared; VIP sees only the profile count | *Subject to decision D-3 |

### 9.13 Notifications (NOTIF)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| NOTIF-001 | P0 | In-app centre is the source of truth; push is an extra channel; types: new match, new message, daily set ready, nearby alert, open ending, report update, message request, verification result, compatibility check | — |
| NOTIF-002 | P0 | Lock-screen-safe generic texts (no names or message content) in RU/EN (HY 1.x) | — |
| NOTIF-003 | P0 | Quiet hours 23:00–08:00 local (messages exempt), max 1 reminder push per local day, per-type toggles, timezone synced from the device | — |
| NOTIF-004 | P0 | Daily set ready at 12:00 local only when the new set has people and wasn't opened | — |
| NOTIF-005 | P1 | Email digests (weekly, opt-in) | — |

### 9.14 Safety (SAFE)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| SAFE-001 | P0 | Block from profile, chat, request; blocked users never see each other anywhere (discovery, nearby, map, checks, requests) | Cross-feature block test |
| SAFE-002 | P0 | Report with categories (fake, harassment, nudity, scam, underage, violence, self-harm, other), urgent categories flagged | Urgent → admin alert |
| SAFE-003 | P0 | Automatic protections: contact-info filter, rate limits, location speed flag, banned photo hashes, report thresholds auto-hide pending review | — |
| SAFE-004 | P0 | Moderation actions: dismiss, warn, hide, restore, remove photo, suspend (family-wide); appeals by email | Audit log |
| SAFE-005 | P0 | Safety centre with dating safety tips and emergency numbers per country | — |

### 9.15 Monetization features (PAY, ADS)
| ID | P | Requirement | Acceptance criteria |
|---|---|---|---|
| PAY-001 | P0 | Tiers Free / Soul+ / Gold / VIP with features in §11; entitlements stored server-side from RevenueCat webhooks (store + web) | Webhook signature verified; idempotent |
| PAY-002 | P0 | Subscription screen comparing tiers; current tier; manage/cancel link per platform; restore purchases | — |
| PAY-003 | P0 | Paywall flag (`PAYWALL_ENABLED`); test activation impossible outside alpha/dev/test | — |
| PAY-004 | P0 | Upsell moments are contextual and dismissible (Liked-you list, rewind, write first, full report); no countdowns | — |
| ADS-001 | P0 | Partner ad cards for Free/Soul+: one after every 10 people (not at multiples of 50) and at the end of the day; labelled "Ad", closable; venue list with "Open in maps"; aggregate impressions/clicks only; no personal targeting | No ads for Gold/VIP; never in chats or match screens |
| ADS-002 | P0 | Ads managed in admin (create, schedule, pause, per-city), real brands only with a signed agreement | — |

### 9.16 Settings and account (ACC)
| ID | P | Requirement |
|---|---|---|
| ACC-001 | P0 | Settings: discovery on/off, hide distance, read receipts, card visibility, share level, flexible fallback, notifications by type, push toggle, theme (Auto/Light/Dark), palette (4), logo (3), language |
| ACC-002 | P0 | Blocked users list with unblock |
| ACC-003 | P0 | Invite friends (codes) and feedback form (with screen and app version) |
| ACC-004 | P0 | About: version, build, environment, legal links |

### 9.17 Admin (ADM)
| ID | P | Requirement |
|---|---|---|
| ADM-001 | P0 | Login with password (argon2) + TOTP; roles: moderator, support, admin; short-lived tokens |
| ADM-002 | P0 | Report queue with urgent first, case view (chat context only for the reported conversation, never Soul Talk/answers/scores), actions, audit log |
| ADM-003 | P0 | Photo checks queue (verification) |
| ADM-004 | P0 | Users lookup (by email), linked personas, status; invites; feedback triage; metrics; ad management |

### 9.18 Internationalisation (I18N)
| ID | P | Requirement |
|---|---|---|
| I18N-001 | P0 | Russian and English for UI, push, emails, reports; locale stored server-side |
| I18N-002 | P1 | Armenian (HY) UI, questions (validated translation), archetype and report texts |
| I18N-003 | P0 | Each answer stores the language it was shown in, so norms can be separated per language |
| I18N-004 | P0 | Names never declined in templates (case-safe phrasing) |

---

## 10. Soul Engine (matching science)

### 10.1 Rules
- Pure, deterministic, versioned TypeScript package (`apps/api/src/engine`), no I/O, no `Date.now()`/`Math.random()`; current `ENGINE_VERSION` 2.2.0.
- Weights, tables and thresholds live in the versioned `match_config`; code holds formulas only.
- ≥ 95% test coverage; property tests (symmetry, bounds, determinism, missing data never lowers a score); golden snapshots of 20 persona pairs reviewed by the founder.
- AI writes text only; it never changes scores, filters or access.

### 10.2 Questionnaires
| Instrument | Items | Use |
|---|---|---|
| Quick Scan starters | 10 (one per Big Five domain + values, kids, weekends, texting rhythm, closeness) | Onboarding; domain confidence 0.25 from one item |
| Quick Scan refine | 27 | "Refine profile", break cards |
| Deep Personality | 116 IPIP-NEO-120 items in 4 parts (O6 political facet excluded), 29 facets | Soul tab |
| Love & Values deep dives | ~20 each | 1.x |

Scoring: reverse keys → 0–100 → bands low/mid/high; Emotional Stability = inverted Neuroticism; positive facet names only (no clinical labels).

### 10.3 Eligibility (before scoring)
Not self · both ready (onboarding done, ≥ 1 photo, discoverable, not hidden) · mutual gender preference · mutual age range · compatible intents · no block either way · not previously matched · not passed recently · no dealbreaker violation.

### 10.4 Compatibility
`score = 100 × intentMultiplier × Σ(wL·layerL) / Σ(wL known)` over five layers:

| Layer | Weight | Dimensions |
|---|---|---|
| Values & life goals | 0.30 | top-3 values overlap (0.5), kids plan (0.3), life direction (0.2) |
| Relationship dynamics | 0.25 | closeness (0.25), independence (0.25), reassurance fit (0.20), conflict style (0.20), care language (0.10) |
| Lifestyle | 0.15 | weekend style, spontaneity, activity, smoking, drinking |
| Communication | 0.15 | texting rhythm (0.5), conversation depth (0.5) |
| Personality | 0.15 | O, C similarity; E tolerant of difference; A and Emotional Stability by similarity + level |

Tiers: ≥ 75 strong · 55–74 good · 35–54 some common ground · < 35 not used for nearby alerts. User-facing percent = score rounded to 5. Reasons (≤ 2 on cards, ≤ 3 in profiles, ≤ 6 in reports) and frictions (with constructive lines) come from codes mapped to localized texts. Compatibility checks by link use the viewer's intent for both (friendship-safe) and pick varied reason kinds.

### 10.5 Ranking (Today's Souls)
`rank = score × freshness (1.0 ≤ 1 day, 0.95 ≤ 7, 0.8 ≤ 30, else 0.6) × newUserBoost (1.1 for the first 7 days)`; order by tier, real people before demo (alpha only), then rank; max 3 of the same archetype in a row. **Payment never affects ranking.**

### 10.6 Learning loop (P1)
Outcome signals (match, Spark, "Did you meet?") collected per pair with config version; offline evaluation before any weight change; changes ship as a new `match_config` version with an A/B holdout.

---

## 11. Monetization

### 11.1 Tiers
| Feature | Free | Soul+ | Gold | VIP |
|---|---|---|---|---|
| Today's Souls / likes per day | 15 | 25 | 50 | Unlimited |
| Full self & "You two" reports | — | ✓ | ✓ | ✓ |
| See who liked you + like back | Count only | Count only | ✓ | ✓ |
| Rewind last pass | — | — | ✓ | ✓ |
| No ads | — | — | ✓ | ✓ |
| Write first (5/day) | — | — | — | ✓ |
| See how many profiles a person has (number only) | — | — | — | ✓ |
| Chat, block, report, safety, verification | ✓ | ✓ | ✓ | ✓ |

### 11.2 Pricing (hypotheses, decision D-5)
| Tier | Monthly (EU/US) | Armenia (local price tier) | Yearly |
|---|---|---|---|
| Soul+ | €4.99 | ≈ 2 000 ֏ | €39.99 |
| Gold | €9.99 | ≈ 3 900 ֏ | €69.99 |
| VIP | €19.99 | ≈ 7 900 ֏ | €129.99 |
Free trial: 7 days Gold for verified users (1.x experiment). Prices set per store region; web prices equal store prices.

### 11.3 Billing rules per platform
- **iOS / Android:** digital features sold only through store IAP (Apple 3.1.1, Google Play Billing). RevenueCat SDK; entitlements from server webhooks; restore purchases.
- **Web:** RevenueCat Web Billing (Stripe); same entitlement ids; VAT handled by Stripe Tax; cancel in Me → Subscription.
- Cross-platform: an entitlement bought anywhere applies everywhere for the same account.
- Refunds follow store policies; web refunds within 14 days (EU withdrawal right).

### 11.4 Advertising
Partner cards (cafés, venues, flowers, events) for Free and Soul+ only; contextual by city, no personal data, no third-party ad networks in 1.0; aggregate reporting to partners.

### 11.5 Revenue model (base case, launch city + diaspora, month 12)
MAU 12 000 → 6% payers (720) × €7 blended = **€5 000/month** subscriptions + ~€500 partner ads. Upside: diaspora at Hinge-like revenue per payer.

---

## 12. Non-functional requirements

### 12.1 Performance budgets
| Metric | Target |
|---|---|
| API latency | p95 < 300 ms for reads, < 500 ms for writes; daily set generation < 1.5 s for 200 candidates |
| Realtime delivery | Message to recipient < 1 s p95 |
| Mobile app | Cold start ≤ 2.5 s; 60 fps swipe; memory ≤ 250 MB |
| Web | Branded HTML splash < 1 s; LCP p75 ≤ 2.5 s (desktop), ≤ 3.5 s (mobile 4G); interactive ≤ 4 s; JS/wasm payload measured per release |
| Images | WebP, max 1600 px, signed URLs cached 10 min |

### 12.2 Availability and scale
- 99.9% monthly API availability; RPO ≤ 24 h (daily backups + PITR on the paid database), RTO ≤ 4 h.
- Launch capacity: 50 000 registered, 5 000 concurrent; horizontal scale requires Redis (§14).

### 12.3 Accessibility
WCAG 2.2 AA: contrast checked for both themes, all controls labelled, focus visible, touch targets ≥ 44 pt, dynamic type to 200%, reduced motion respected, colour never the only signal, screen readers on all key flows.

### 12.4 Localization
RU/EN at launch, HY in 1.x; ICU plurals (e.g. "1 вопрос / 2 вопроса / 5 вопросов"); dates and numbers per locale; case-safe phrasing with names.

### 12.5 Reliability
Idempotent likes, messages (client ids) and webhooks; retries with backoff for email/push; graceful degradation when AI, push or tiles are down.

### 12.6 Observability
Structured JSON logs with request ids and PII redaction; Sentry (API + Flutter) with scrubbing; uptime monitor on `/ready`; dashboards for latency, errors, queue sizes, moderation backlog; alerting to the on-call channel.

---

## 13. Security and privacy

### 13.1 Data classes and retention
| Class | Examples | Rules |
|---|---|---|
| S1 public-ish | first name, photos, bio, archetype | Visible per settings |
| S2 sensitive | answers, soul profile, location cell, messages, verification selfie | Never exposed to others; selfie deleted on decision; location ≤ 24 h; messages until unmatch/deletion |
| S3 strictest | Soul Talk transcripts and insights | App-level encryption, owner-only, crypto-shred, 90-day TTL |

### 13.2 Controls
| Threat | Control |
|---|---|
| Account takeover | Email codes with limits, social tokens verified server-side, refresh rotation + reuse detection, logout-all |
| IDOR / data leaks | Ownership check on every route; 404 instead of 403 for others' resources; allowlist DTOs with contract tests |
| Trilateration / stalking | Distance bands; approximate map only for opted-in matches; H3 snapping; no location history |
| Fake profiles | Selfie verification, photo moderation, banned hashes, report thresholds |
| Scams / spam | Contact-info filter in early messages, rate limits, write-first limits |
| Web attacks | CSP (self + allowlisted), helmet, httpOnly cookies, CSRF header, CORS allowlist, no-store on personal API responses |
| Mobile | Keychain/Keystore, certificate pinning (1.x), no secrets in the app bundle, obfuscated release builds |
| Supply chain | Locked dependencies, CI audit, signed builds |
| Admin abuse | TOTP, roles, audit log, no access to S3 data, answers or scores |

### 13.3 Privacy commitments
GDPR-level baseline for all markets: lawful basis per purpose, consent for optional processing, data minimisation, DPIA for location and verification, records of processing, DPAs with processors (hosting, email, storage, push, analytics, AI, payments), data subject rights (export, deletion, correction) inside the app, EU/Frankfurt hosting.

---

## 14. Architecture and infrastructure for production

### 14.1 Components
```
Clients: Flutter iOS · Android · Web (PWA) ──HTTPS/WSS──► API (NestJS, Node 22) ── Postgres 17 (managed, PITR)
                                                        ├─ Redis (rate limits, jobs, socket adapter)
                                                        ├─ Worker (daily sets, nearby matcher, purge/retention, push)
                                                        ├─ Object storage R2/S3 + CDN (photos, exports)
                                                        ├─ Email (Brevo/Resend) · Push (FCM/APNs, Web Push)
                                                        ├─ RevenueCat (stores + Stripe web) · Map tiles provider
                                                        └─ Anthropic (AI writing, Soul Talk — 1.x)
Admin web (/admin) · Sentry · Uptime monitor · PostHog (EU, consent)
```

### 14.2 Changes from the alpha
| Area | Alpha | Production |
|---|---|---|
| Hosting | Render free web + free Postgres | Paid web (≥ 2 instances) + worker + managed Postgres with backups; custom domain with HTTPS |
| Jobs / limits | In-process intervals, in-memory limiter | Redis + BullMQ; Socket.IO Redis adapter |
| Photos | Stored in Postgres (`STORAGE_DRIVER=db`) | R2/S3 + CDN, signed URLs |
| Email | Codes on screen | Brevo/Resend with verified domain |
| Map tiles | Proxy to volunteer OSM servers | Commercial tile provider via the proxy |
| Demo profiles, tester tools, test billing | On | Impossible (runtime + build-time guards), not seeded |
| Search indexing | `noindex` | Indexable, sitemap, Search Console |

### 14.3 Environments
Development · Test/CI · Alpha (friends) · **Staging** (mirror of production, synthetic data) · **Production**. Separate databases, buckets, secrets, Firebase, RevenueCat projects and domains.

### 14.4 CI/CD and releases
- CI: API lint, typecheck, engine coverage gate, all tests on Postgres, build; Flutter analyze, tests, web build, Android AAB, iOS IPA (when signing secrets exist).
- Web/API: deploy on merge to `main` after green CI → staging → manual promote to production; database migrations forward-only.
- Mobile: semantic versions; TestFlight + Play internal for every release candidate; phased rollout (Play staged 10% → 50% → 100%, App Store phased release); `minSupportedVersion` for forced updates; API stays backward compatible for two app versions.

---

## 15. Data model and API overview

### 15.1 Main entities (≈ 50 tables)
Users and auth (users, sessions, auth_codes, auth_identities, consents, device_tokens) · profile (profiles, photos, media, profile_interests, personality_cards) · engine (engine_answers with locale, soul_profiles, layer_overrides, match_config) · discovery and matching (daily_sets, likes, matches, messages, message_requests, pair_outcomes) · geo (user_locations, nearby_sessions, nearby_alerts, nearby_later, map_shares) · growth (soul_links, soul_checks, invites) · trust (photo_verifications, blocks, reports, moderation_reports, moderation_actions, audit_events) · money (entitlements, billing_events, ad_cards) · Soul Talk (soul_sessions, soul_messages, soul_insights, user_data_keys, safety_events) · ops (notifications, feedback, ratings, data_export_jobs, app_secrets, admin_users).

### 15.2 API surface (REST `/v1`, ≈ 130 routes)
Auth (code, verify, refresh, logout, social, providers, switch) · Me (profile, consents, onboarding, personas, verification, soul link, export, delete) · Engine (questionnaires, answers, progress, soul profile) · Discovery (daily set, profiles, soul-link checks) · Matches (likes, received, rewind, requests, matches, messages, read, reports) · Nearby (location, open/close/status/list/later, map, map share/stop, tiles) · Notifications (centre, devices, push config) · Safety (blocks, reports) · Billing (status, webhook) · Ads · Soul Talk · Admin (`/admin/v1`) · SEO (`/robots.txt`, `/sitemap.xml`) · Health (`/health`, `/ready`).
Errors: `{error: {code, message, request_id, details}}`; validation with strict schemas; OpenAPI published at `docs/api/openapi.yaml` (to be generated before 1.0).

---

## 16. Analytics and dashboards

### 16.1 Principles
Server-side events, consent-gated, no PII, no message content, no answers, no coordinates; user ids pseudonymous.

### 16.2 Key events
`account_created` · `code_verified` · `social_sign_in` (provider) · `quick_scan_completed` · `soul_profile_revealed` · `onboarding_completed` · `daily_set_opened` · `like_sent` / `pass_sent` · `match_created` · `spark_reached` · `message_sent` (count only) · `verification_submitted` / `approved` · `soul_link_shared` · `soul_check_completed` · `story_card_shared` · `open_to_meet_started` · `nearby_alert_sent` · `map_share_started` · `paywall_viewed` · `subscription_started` / `renewed` / `cancelled` · `ad_impression` / `ad_click` · `report_submitted` · `block` · `account_deleted`.

### 16.3 Dashboards
Acquisition (source, platform, K-factor from links) · Activation funnel (sign-up → 10 questions → photo → first like → first match) · Engagement (DAU/MAU, Sparks, messages per match) · Market health (gender ratio, time to first match by gender) · Trust (verification rate, reports per 1 000 actives, backlog, SLA) · Revenue (payers by tier/platform, ARPPU, churn, trial conversion) · Quality (crash-free, latency, errors).

---

## 17. Trust, safety and operations

| Process | Standard |
|---|---|
| Urgent reports (underage, violence, self-harm, threats) | First action < 1 h, 24/7 alerting |
| Other reports | < 24 h |
| Photo verification queue | < 24 h (target < 4 h in daytime) |
| Appeals | < 72 h by email |
| Law-enforcement requests | Documented process, legal review |
| Incident response | Runbooks: account takeover, data leak, harassment escalation, outage, restore from backup |
| Moderation staffing | Founder + 1–2 part-time moderators at launch; tooling in admin |
| Content policy | Public community guidelines (no nudity, no hate, no scams, no minors, real photos only) |

---

## 18. Legal and store compliance

| Area | Requirement |
|---|---|
| Terms of Service & Privacy Policy | Production versions (RU/EN/HY), versioned consent, published on the web |
| Age | 18+ in stores and in-app; DOB gate; consider document checks where the law requires (decision D-6) |
| GDPR / EU users | Lawful bases, DPAs, DPIA (location, verification), EU hosting, DSA notice-and-action for illegal content, single point of contact |
| Armenia | Law on Protection of Personal Data: notification to the authorised body where required, consent and cross-border transfer rules |
| Apple App Store | 1.2 (UGC: report, block, filter, contact), 3.1.1 (IAP for digital goods), 4.8 (Sign in with Apple), 5.1.1 (account deletion, data use), dating age rating 17+/18+, privacy nutrition label, review test account (email code delivered to a reviewer mailbox) |
| Google Play | UGC policy, Data safety form, account deletion web link, Play Billing, target API level, 18+ content rating, reviewer access |
| Payments | Store terms; Stripe for web with VAT; EU 14-day withdrawal for web |
| Advertising | Clear "Ad" labels, partner agreements, no personal targeting |
| Psychometrics | IPIP items are public domain; translations documented; no clinical claims |
| Trademarks | Brand logos on social buttons follow Apple/Google/VK guidelines |

---

## 19. Quality assurance and device matrix

### 19.1 Test levels
Engine unit + property + golden tests · API integration tests on real Postgres (permissions, privacy contracts, limits, flags in both states) · Flutter widget/golden tests per breakpoint for key screens · end-to-end flows in headless browsers (web) and Patrol/integration_test (mobile) · security tests (IDOR, brute force, uploads, token reuse) · load tests (daily set, chat) · accessibility audits · store pre-launch reports.

### 19.2 Device matrix
| Platform | Devices / browsers |
|---|---|
| Android | Samsung A-series (2–4 GB RAM), Pixel 6–9, Xiaomi Redmi; Android 8–15 |
| iOS | iPhone SE (3rd), 12, 14, 16 Pro Max; iOS 16–19; iPad (medium layout) |
| Mobile web | Chrome Android, Samsung Internet, Safari iOS (tab + installed PWA) |
| Desktop web | Chrome, Edge, Firefox, Safari — last 2 versions; 1366×768, 1440×900, 1920×1080 |
| Tablet | iPad 10.9", Android 11" — 820–1180 px |

### 19.3 Release acceptance (every release)
Lint, types, all tests green · engine coverage ≥ 95% · full walkthrough at 3 breakpoints · no P0/P1 bugs open · crash-free ≥ 99.5% in beta · store pre-launch report clean.

---

## 20. Launch plan and go/no-go

### 20.1 Milestones
| Milestone | Content | Exit |
|---|---|---|
| **M10 Production readiness** | Real email, domain, paid hosting + backups, R2, Redis/worker, Sentry, tiles provider, remove alpha shortcuts, legal texts, admin staffing | Staging passes the full walkthrough |
| **M11 Mobile store builds** | Native push, native social sign-in, IAP via RevenueCat, deep links, forced update, store listings | TestFlight + Play closed testing approved |
| **M12 Closed beta** (invite-only, Yerevan, 300–500 users) | Paywall off or discounted, verification push, community events | Beta gate: activation ≥ 60%, Sparks/week ≥ 1 per 5 actives, women ≥ 35%, crash-free ≥ 99.5% |
| **M13 Public launch** | Open registration, paywall on, marketing (promo video, creators, campus ambassadors), SEO landing pages | Go/no-go below |
| **M14 1.x** | Armenian language, Soul Talk, automated verification, travel mode, outcome learning | — |

### 20.2 Go / no-go checklist (public launch)
- [ ] All P0 requirements implemented and tested on iOS, Android, desktop web and mobile web.
- [ ] No alpha shortcuts reachable in production (demo profiles, on-screen codes, test billing, tester tools, TEST badge) — verified on production.
- [ ] Backups restored successfully in a drill; monitoring and alerting live.
- [ ] Terms, Privacy, community guidelines published; consent version bumped.
- [ ] Store approvals; reviewer accounts working.
- [ ] Moderation on-call schedule and SLAs in place.
- [ ] Load test passed at 5 000 concurrent.
- [ ] Founder sign-off.

### 20.3 Go-to-market (summary — see `docs/marketing/seo-and-launch.md`)
Promo video (Reels/TikTok/Shorts) · compatibility-link virality · campus ambassadors (YSU, AUA, Polytech, RAU) · IT companies and coworkings · Yerevan Telegram channels and micro-creators · partner cafés ("compatibility dates") · diaspora targeting · SEO for "compatibility test" / "personality test" queries.

---

## 21. Risks and mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Small launch pool (empty days) | Users churn | High | Refill rule, flexible age widening, invite-only density, campus focus, diaspora/multi-city |
| Gender imbalance (79% men in market) | Women overwhelmed, men frustrated | High | Daily limits, verification, write-first only for VIP, women-first marketing, safety features |
| Fake profiles / scams | Trust loss | Medium | Verification, moderation SLAs, filters, report thresholds |
| Store rejection (dating, UGC, IAP) | Launch delay | Medium | Compliance checklist §18, early TestFlight/Play review |
| Personas perceived as deceptive | Trust | Medium | Decision D-3 (limit to 1 profile publicly or disclose) |
| Psychometric validity of translations | Match quality | Medium | Locale-tagged answers, separate norms, validated HY/RU translations |
| Flutter web performance on low-end phones | Conversion from links | Medium | HTML splash, renderer choice by measurement, lightweight landing for /c links (1.x) |
| AI safety (Soul Talk) | Harm, liability | Low (feature off until approved) | Crisis evals 100%, approved texts, human escalation |
| Cost overrun (AI, maps) | Margin | Low | Daily AI budget cap, tile caching, provider free tiers |
| Single-founder operations | Slow response | Medium | Runbooks, part-time moderators, alerting |

---

## 22. Open decisions (founder)

| # | Decision | Default until decided |
|---|---|---|
| D-1 | Launch city and countries (Yerevan first; EU/diaspora when?) | Yerevan + diaspora targeting |
| D-2 | Domain (`nearsoul.app` / `.am`) and brand registration | `nearsoul.app` |
| D-3 | Personas in production: keep, limit, or disclose to others | Keep, max 2, disclosed in Terms |
| D-4 | Matches map precision (≈ 460 m area vs exact) | Area (privacy-safe) |
| D-5 | Final prices, trial, local Armenian price tier | §11.2 table |
| D-6 | Age assurance beyond DOB in each market | DOB + reports + verification |
| D-7 | Soul Talk go-live: crisis texts, hotlines, Anthropic key | Off until approved |
| D-8 | Automated verification vendor (cost, biometric consent) | Moderator review |
| D-9 | Armenian translation partner for questions and texts | Professional translator + pilot norms |
| D-10 | Real ad partners and agreements | Ads off in production until a signed partner |

---

## 23. Appendices

### A. Glossary
**Soul Engine** — the deterministic psychometric and matching engine. **Soul type / archetype** — friendly name from the two strongest high domains. **Today's Souls** — the daily curated set. **Spark** — a match with ≥ 6 messages. **Share level** — how much of your profile reports may reveal. **Open to meet** — a 1–4 h window for nearby alerts. **Persona** — an extra separate profile under one sign-in. **Compatibility link** — personal `/c/{code}` link for friend/crush checks.

### B. Screen inventory (all platforms)
Welcome · Email · Code · Age · Consents · Quick Scan · Scan complete · Soul reveal · Share level · Basics · Photos · Interests · Discovery opt-in · Today (cards / list) · Candidate profile · Write first composer · Match moment · Nearby · Open to meet sheet · Nearby list · Matches map · Soul · Story card · Compatibility check (preview / result) · Who checked · Refine questions · Deep Personality · Self report · Matches · Requests · Liked you · Chat · "You two" report · Me · Profiles · Edit profile · Photos · Verify photos · Interests · Subscription · Settings · Notifications · Blocked users · Safety centre · Invite friends · Feedback · About · Delete account · Blocked (underage) · Download app · Admin (login, reports, case, photo checks, users, invites, feedback, metrics, ads).

### C. Change requests included (CR-1 … CR-34)
CR-1 H3 instead of PostGIS · CR-2 in-process jobs (Redis in production) · CR-3 direct uploads · CR-4 static admin · CR-5/7 AI writer and templates · CR-8 locale-tagged answers · CR-9 political items excluded · CR-10 positive facet names · CR-14 skippable steps, one photo · CR-15 palettes · CR-16 on-screen codes (alpha only) · CR-17 personas · CR-18 Soul+/Gold/VIP · CR-19/27 demo profiles (alpha only) · CR-20 swipe and list · CR-21 10 starter questions · CR-22 final onboarding step · CR-23 match percent · CR-24 logo · CR-25 ad cards · CR-26 write first · CR-27 paging and breaks · CR-28 partner venues · CR-29 matches map · CR-30 selfie verification · CR-31 compatibility links · CR-32 match moment and refill · CR-33 social sign-in · CR-34 SEO and promo.

### D. Alpha → production delta (engineering backlog)
1. Email provider + verified domain; remove on-screen codes.
2. Custom domain, `APP_PUBLIC_URL`, indexable SEO, Search Console.
3. Paid Render (or equivalent) web ×2 + worker + managed Postgres with PITR.
4. Redis + BullMQ + Socket.IO adapter; move schedulers to the worker.
5. R2/S3 + CDN; migrate photos out of Postgres.
6. Commercial map tiles behind `/v1/tiles`.
7. Native push (Firebase project, APNs key), native social sign-in SDKs, IAP via RevenueCat, deep link files (`apple-app-site-association`, `assetlinks.json`), forced update config.
8. Bundle id `app.nearsoul`, signing keys, store listings, privacy labels, reviewer accounts.
9. Sentry (API + Flutter), uptime monitoring, dashboards.
10. Remove demo seeding from the production start command; verify tester tools and test billing return 404.
11. Legal texts and consent version; community guidelines page; deletion web page.
12. OpenAPI document; threat model; runbooks; backup restore drill; load test.
13. Admin: ad management UI, moderator roles staffed.
