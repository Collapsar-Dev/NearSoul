# Implementation status

Updated: 2026-10-16. Statuses: NOT STARTED → IN PROGRESS → IMPLEMENTED → TESTED → ACCEPTED (founder only).

## Evidence (commands run on 2026-10-16)
| Command | Result |
|---|---|
| `cd apps/api && npx jest` | 11 suites, 163 tests passed (engine unit + property tests; integration tests on real Postgres) |
| GitHub Actions CI (run 38901751005) | API, Flutter (web + APK), Windows, macOS green; Linux desktop fixed (libsecret) |
| Render start command on an empty DB (APP_ENV=alpha, STORAGE_DRIVER=db) | migrations, seeds, 48 demo profiles, web + admin served, /ready ok |
| Same-origin realtime chat check | demo reply delivered over the socket in < 2 s, localized |
| `cd apps/api && npx jest src/engine --coverage` | engine lines 100%, statements 99.8%, branches 94.8% |
| `cd apps/api && npx eslint "src/**/*.ts" "test/**/*.ts"` / `npx tsc --noEmit` | clean |
| `cd apps/app && flutter analyze` | No issues found |
| `cd apps/app && flutter test` | 6 tests passed |
| `flutter build web --release` | built |
| Manual browser walkthrough (web, medium + compact widths) | sign-up with email code → DOB → consents → Quick Scan → Soul Profile reveal → Today's Souls → like → match with demo → realtime chat with demo auto-reply → "You two" report → Nearby → Soul tab |

## Milestones
| Milestone | Status | Notes |
|---|---|---|
| M0 Foundation | IMPLEMENTED | Monorepo, local Postgres script, CI workflow, Render blueprint, ADRs. CI not yet run on GitHub (not pushed) |
| M1 Identity + invites | TESTED | AUTH-001..005 (deletion needs a fresh email code), ONB-001..003, ONB-002a, ALPHA-001 |
| M2 Soul Engine core | TESTED | ENG-001/002/005/006/007/008/009/010/016. Band/archetype texts are DRAFT for founder review |
| M3 Profile & photos | TESTED | PROF-001..003 (direct upload, CR-3) |
| M4 Matching & Today's Souls | TESTED | ENG-011..014, ENG-015 collection, LIKE-001..003, ALPHA-002 demo profiles |
| M5 Chat, notifications, safety, admin | TESTED | CHAT-001..003 (starters templated), LIKE-004, SAFE-001..005, NOTIF-001 in-app + realtime; **push (FCM) not wired yet**; admin panel static client (CR-4) |
| M6 Reports | TESTED | RPT-001..003 with deterministic templates (CR-7); paywall gating tested in both flag states |
| M7 Nearby Now | TESTED (server) / IMPLEMENTED (app) | GEO-001..007, ALPHA-003 simulator. Not yet tested with two physical phones |
| A1 Alpha release | IN PROGRESS | render.yaml ready (free tier, open registration). Waiting for the founder: Render Blueprint + Brevo sender/API key. Later: own domain, R2, Anthropic key, APK signing, admin account |
| M8 Deep Personality & Soul Talk | IN PROGRESS | Deep Personality (ENG-003) TESTED: 116 IPIP-NEO-120 items in 4 parts, 29 facets, domains switch to deep scores, background recompute on ENGINE_VERSION bump. Soul Talk not started (needs approved crisis texts) |
| M9 Payments & ops | NOT STARTED | |

## Known gaps before inviting friends
- FCM push (Android) and Web Push — in-app notification centre + realtime work.
- Real-device tests (Android phone pair for Nearby; iPhone PWA).
- Russian translation of IPIP items (CR-8).
- Founder review of band texts, archetype texts and golden persona pairs.
