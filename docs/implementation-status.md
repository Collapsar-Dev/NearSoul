# Implementation status

Updated: 2026-10-16. Statuses: NOT STARTED → IN PROGRESS → IMPLEMENTED → TESTED → ACCEPTED (founder only).

## Evidence (commands run on 2026-10-16)
| Command | Result |
|---|---|
| `cd apps/api && npx jest` | 23 suites, 242 tests passed (engine unit + property + golden snapshot tests; integration tests on real Postgres) |
| Browser check of Settings → «О чём уведомлять» | toggle saved (notify_prefs), browser timezone synced to the server |
| Web Push round trip (headless Chromium 151) | subscribe via web/push.js → server PushService → Google push service → service worker shows the localized notification with the right deep link |
| GitHub Actions CI (run 38901751005) | API, Flutter (web + APK), Windows, macOS green; Linux desktop fixed (libsecret) |
| Render start command on an empty DB (APP_ENV=alpha, STORAGE_DRIVER=db) | migrations, seeds, 48 demo profiles, web + admin served, /ready ok |
| Same-origin realtime chat check | demo reply delivered over the socket in < 2 s, localized |
| `cd apps/api && npx jest src/engine --coverage` | engine lines 100%, statements 99.8%, branches 94.8% |
| `cd apps/api && npx eslint "src/**/*.ts" "test/**/*.ts"` / `npx tsc --noEmit` | clean |
| `cd apps/app && flutter analyze` | No issues found |
| `cd apps/app && flutter test` | 7 tests passed |
| Browser check of personas (CR-17) | create «Спокойная» from My profiles → lands on its Quick Scan with age/terms inherited → switch back from the unfinished profile → main profile's Today |
| Browser check in the /mobile phone frame (alpha mode) | Russian Mini-IPIP items, labelled middle points on two-ended scales, skip on reveal/share/photos/interests → Today, photo upload from a 3000×4000 PNG (converted to JPEG in the browser) → 201, dark theme + Sage palette |
| Browser check, Render-like alpha mode (APP_ENV=alpha, EMAIL_PROVIDER=screen, STORAGE_DRIVER=db) | sign-up with the on-screen code → onboarding; logout now ends the session (was 401: the client sent no token to /v1/auth/logout) |
| `flutter build web --release` | built |
| Manual browser walkthrough (web, medium + compact widths) | sign-up with email code → DOB → consents → Quick Scan → Soul Profile reveal → Today's Souls → like → match with demo → realtime chat with demo auto-reply → "You two" report → Nearby → Soul tab |

## Milestones
| Milestone | Status | Notes |
|---|---|---|
| M0 Foundation | IMPLEMENTED | Monorepo, local Postgres script, CI workflow, Render blueprint, ADRs. CI not yet run on GitHub (not pushed) |
| M1 Identity + invites | TESTED | AUTH-001..005 (deletion needs a fresh email code), ONB-001..003, ONB-002a, ALPHA-001 |
| M2 Soul Engine core | TESTED | ENG-001/002/005/006/007/008/009/010/012 (golden pairs, docs/engine/golden-pairs.md)/016. Band/archetype texts are DRAFT for founder review |
| M3 Profile & photos | TESTED | PROF-001..003 (direct upload, CR-3) |
| M4 Matching & Today's Souls | TESTED | ENG-011..014, ENG-015 collection, LIKE-001..003, ALPHA-002 demo profiles |
| M5 Chat, notifications, safety, admin | TESTED | CHAT-001..003 (starters templated), LIKE-004, SAFE-001..005, NOTIF-001 in-app + realtime + Web Push (VAPID keys auto-generated, Settings toggle, SSRF-safe endpoint allowlist); per-type push toggles, quiet hours 23:00–08:00 (messages exempt), max 1 reminder push per local day, daily_set_ready at 12:00 local (only when the new set has people and wasn't opened), timezone synced from the device; FCM HTTP v1 path ready, live once a Firebase service account is set; admin panel static client (CR-4) |
| M6 Reports | TESTED | RPT-001..003 with deterministic templates (CR-7); paywall gating tested in both flag states |
| M7 Nearby Now | TESTED (server) / IMPLEMENTED (app) | GEO-001..007, ALPHA-003 simulator. Not yet tested with two physical phones |
| A1 Alpha release | IN PROGRESS | render.yaml ready (free tier, open registration) and needs **no accounts or keys**: sign-in codes are shown on screen (EMAIL_PROVIDER=screen, alpha only). Waiting for the founder: Render Blueprint. Later: own domain, R2, Anthropic key, APK signing, admin account |
| M8 Deep Personality & Soul Talk | IN PROGRESS | Deep Personality (ENG-003) TESTED: 116 IPIP-NEO-120 items in 4 parts, 29 facets, domains switch to deep scores, background recompute on ENGINE_VERSION bump. Soul Talk IMPLEMENTED + TESTED behind `SOUL_TALK_ENABLED=false`: 8 topics, encrypted owner-only storage with crypto-shred, safety classifier + bilingual keyword backup, fixed crisis message (DRAFT), insights → traits only after Keep, Soul Map, purge job. **Cannot go live until the founder approves the crisis message and resources (CRISIS_TEXTS_APPROVED) and an Anthropic key is set** |
| Personas (CR-17) | TESTED | Separate profiles under one sign-in: /v1/me/personas, /v1/auth/switch, family-wide blocks/suspension/deletion, shared Soul+, push to the active device; app: My profiles screen, switcher reachable from unfinished profiles; Today explains an empty set when most questions were skipped |
| Swipe + feed on Today (CR-20) | TESTED in headless Chromium (412×915): drag right shows the «НРАВИТСЯ» stamp, release likes and shows the next card; List view scrolls through all 14 remaining people by touch-drag and wheel |
| Subscription levels (CR-18) | TESTED | Soul+/Gold/VIP, test activation, tier-sized daily sets with same-day top-up, Liked you, rewind, VIP profile count; app: Subscription screen, Liked you, Undo snackbar, upsells. Live check: photo upload of a 4032×3024 JPEG on Render works |
| M9 Payments & ops | IN PROGRESS | PAY-001..003 TESTED (RevenueCat webhook, entitlements, paywall sheet; store products not set up yet). ACC-002 data export TESTED. ANL-001 consent-gated server analytics TESTED (needs POSTHOG_KEY) |

## Founder feedback 2026-10-18, round 2
- Logo (ghost-soul with a heart) in icons, favicon, welcome, navigation rail.
- Match percentage + 2 reasons on cards, 3 + "N more" in profiles (CR-23).
- Template personality cards render in the viewer's language (demo cards were English); "based on their answers" on others' cards.
- My profiles: cards no longer squeeze text; full-width switch button.
- Daily "keep discovering yourself" nudge on Today after 3 cards while Quick Scan questions remain.
- Checked at 412 (phone, Android UA), 820 (tablet) and 1440 (desktop) widths: card view, feed grid (1/2/3 columns), profiles.

## Founder feedback 2026-10-18 (fixed, checked at phone size with an Android user agent)
- Keyboard on phones: forced semantics is now desktop-only (it intercepted taps on text fields on mobile web).
- Quick Scan ends with «Первый этап пройден!» and a «Смотреть результат» button.
- Today's card fits the screen with ✕ / ⓘ Подробнее / ♥; the opened profile has its own ✕/♥; photos open full screen.
- Likes per day equal the daily set size of the level (free 15, Soul+ 25, Gold 50, VIP unlimited).
- **Bug fixed:** likes to people shown through the widened age range returned 404 and the app skipped them silently. The actor's own age filter no longer blocks a like; the app now says when a person is gone.
- Personas are discoverable: «Сменить или добавить профиль» under the name in Me, explained menu item and create dialog, «Профиль: …» shown while the new profile is filled in.

## UX pass (2026-10-17, full new-user walkthrough at phone size)
Fixed: gender-neutral Russian personality texts and strengths; no preset birthday + a "can't be changed later" note; «Души дня» instead of "Today’s Souls" in Russian; "Твоя карточка личности"; share level preselected (standard); explanation under "Не сейчас"; one-time swipe hint on Today; Me menu grouped (Профиль / Аккаунт / Помощь) with clear names; duplicated "до 3" removed; personal API responses are `Cache-Control: no-store`.
Checked and fine: age range defaults to own age ±5; photo upload; match → chat → demo reply.

## Fixed on 2026-10-17 from founder testing
- Photo upload failed on the web: CSP `connect-src` blocked the `blob:` URL the image picker uses to read the file. Phone photos (HEIC, huge) are now re-encoded to JPEG in the browser.
- Two Quick Scan scales showed bare numbers 2–4; 20 personality items were in English.

## Known gaps before inviting friends
- Native push: Android app needs Firebase (google-services + FCM_SERVICE_ACCOUNT_JSON). Web Push works now; on iPhone it needs the app added to the Home Screen.
- Real-device tests (Android phone pair for Nearby; iPhone PWA).
- Russian translation of IPIP items: Mini-IPIP has a draft translation (CR-8); Deep Personality items are still English.
- Founder review of band texts, archetype texts and golden persona pairs.

## Before production (founder: "prepare for production")
- Email: EMAIL_PROVIDER=brevo (or resend) + API key + verified EMAIL_FROM. `screen` is refused by the server in staging/production; with `screen` anyone who types an email can sign in as it.
- Render free Postgres is for testing only (limited lifetime and no backups): move to a paid database.
- Own domain, R2/S3 storage instead of photos in Postgres, APK signing, Anthropic key, Firebase for native push.
