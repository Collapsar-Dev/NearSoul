> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 18. Release plan

## 18.1 Stages
| Stage | Who | Where | Goal | Exit |
|---|---|---|---|---|
| **Alpha (friends test)** | 15–50 invited friends | `APP_ENV=alpha`: web/PWA + Android APK (+ iOS TestFlight and desktop builds if available) | Does the core idea feel right? Is the Soul Profile accurate? Do people match and talk? | Alpha gate [19 §19.1](19-acceptance-checklists.md) + founder decision |
| **Closed beta** | 100–300 invited users in the launch city | Production: web + Google Play internal testing + TestFlight | Retention, engine quality, safety operations, what people value in reports | Beta gate [19 §19.2](19-acceptance-checklists.md) |
| **Public launch** | Launch city | Web + App Store + Google Play | Growth in one city, paywall on | Founder decision |

## 18.2 Alpha: what testers experience
1. The founder sends a link `https://<alpha-domain>/invite/AB12CD34`.
2. The friend opens it on any device: web works immediately and can be installed as an app (PWA). Android friends can also install the APK from the download page.
3. Sign‑up with an email code → Quick Scan → **Soul Profile reveal** → profile → Today's Souls (real testers + clearly marked demo profiles) → like, match, chat, read "You two" reports for free → try Nearby (real location or the simulator).
4. A "Feedback" button is everywhere. After the reveal they're asked: "How accurate does this feel?" (1–5).

## 18.3 Alpha requirements (ALPHA‑xxx)

**ALPHA-001: Invite‑only access**: `INVITE_ONLY=true`. New accounts need a valid code (admin‑created, or from a tester: each tester gets `invites_left=3`). `/invite/{code}` pre‑fills the code. Codes: 8 characters, no ambiguous characters (0/O, 1/I), case‑insensitive. Rate limit validation 10/h/IP. **AC:** sign‑up without a code fails with a friendly message. A used single‑use code fails. Inviter counts update.

**ALPHA-002: Demo profiles (alpha only)**
- A seed script creates **40–60 demo users** in the launch city with realistic, varied engine profiles (sampled across all archetypes, intents, genders and ages 20–45), short bios and interests.
- **Photos: illustrated avatars, never photos of real people.** Every demo card and profile shows a "DEMO" badge.
- Behaviour: demo profiles like back with a probability based on compatibility (score ≥ 55 → 60%, else 15%), so testers can experience matching. In chat they reply **once**, automatically: "Hi! I'm a demo profile, so I can't really chat. Match with a real tester to try the full experience 🙂". Pair reports with demo profiles work normally.
- Ranking: real testers are always placed above demo profiles of the same tier. Demo profiles only fill remaining slots in Today's Souls.
- Safety: the seed script refuses to run unless `APP_ENV=alpha`. Production startup fails if any `is_demo=true` user exists. Demo profiles are excluded from analytics funnels (flag in events).
- **AC:** a new tester sees a full Today's Souls set on day one. Demo badges appear everywhere demo users appear (card, profile, match, chat, report).

**ALPHA-003: Location simulator (testers only)**
- Me → Alpha tools (S45): choose one of ~10 preset places in the launch city (e.g. "City centre", "University", "Old town") or drop a pin. Sends `POST /v1/alpha/location`, which runs the same snapping/band logic as GEO‑003 with `simulated=true`.
- A "Simulated location" banner stays visible while it's active. Clears when Open to meet ends.
- Only on `APP_ENV=alpha` with role `tester` (all invited users get `tester` in alpha). The endpoint returns 404 elsewhere. The production build excludes the UI at compile time (`--dart-define=APP_ENV`).
- **AC:** two testers at home in different districts can simulate the same preset place and receive a nearby alert.

**ALPHA-004: In‑app feedback**: floating Feedback button (S43) on main screens + Me → Send feedback. Categories: bug, idea, confusing, engine felt wrong, other. Auto‑attached: app version, platform, screen route, optional screenshot (asks first). Stored in `feedback`, visible in admin. Sentry captures crashes with the same app version.

**ALPHA-005: Reveal accuracy check**: after the Soul Profile reveal: "How accurate does this feel?" 1–5 stars + optional "What felt off?" (free text, ≤ 300 chars, stored with the engine version, never shown to others). Same quick question after opening a first pair report: "Did this match your impression?" Used for the engine quality report.

**ALPHA-006: Engine debug for testers**: S45 → "Show engine debug": the tester's own domain scores (numbers), confidence, archetype derivation, and for a match the layer scores + reason/friction codes, **only if both people are testers with share level `deep`**. Never raw answers.

**ALPHA-007: Test version signals**: "TEST" badge in the app bar. Alpha terms consent (ONB‑002a). Data reset runbook (`docs/runbooks/alpha-reset.md`): 48 h in‑app banner + email before any reset.

**ALPHA-008: Download page**: `/download` on the alpha domain (public, no login): web "Open NearSoul" + "Install as app" instructions, Android APK link (latest CI artifact via a stable URL), TestFlight public link (if available), Windows/macOS/Linux builds (if available), short install instructions per platform (including "right‑click → Open" for unsigned macOS builds and "allow installs from this source" for the APK).

**ALPHA-009: Cost and abuse guard**: AI daily budget `AI_DAILY_BUDGET_USD=10` in alpha (`CONFIRM`). Email sends capped per day. All normal rate limits active.

**ALPHA-010: Testers guide**: `docs/alpha-testers-guide.md` (en + ru, one page): what NearSoul is, how to install, what to try (checklist: Quick Scan, reveal, rate accuracy, like 5 people, chat with a real tester, open a "You two" report, try Nearby with a friend, send feedback), privacy note, how to delete the account.

## 18.4 Distribution per platform (Alpha)
| Platform | How the agent sets it up | What the founder needs to provide |
|---|---|---|
| Web + PWA | CI deploys `apps/app` web build to the alpha static host on every merge to `main` | A domain (`CONFIRM`) and DNS access |
| Android | CI builds a signed release APK (alpha keystore in CI secrets) and publishes it to a stable download URL (or Firebase App Distribution) | Approve keystore creation (store it safely: losing it blocks updates) |
| iOS | CI builds with fastlane and uploads to TestFlight | Apple Developer account ($99/year) + App Store Connect API key. **Without it, iPhone users use the PWA** |
| Windows / macOS / Linux | CI builds zip / dmg / AppImage artifacts attached to a GitHub Release | Nothing for unsigned alpha builds. Code signing certificates later (P1) |
| Backend | Render services (API, worker, Postgres+PostGIS, Redis) via `render.yaml` blueprint | Render account, payment method if a paid plan is needed |
| Email | Resend/Postmark with a verified sending domain | Domain DNS records (SPF, DKIM) |
| AI | Anthropic API key in Render secrets | API key + billing |
| Monitoring | Sentry + PostHog projects | Accounts (free tiers are enough for alpha) |

## 18.5 Roadmap: milestones (build in this order)
Each milestone ends with: CI green, status file updated, a short demo note, and the alpha environment deployed.

**M0: Foundation**
- [ ] Monorepo (D34), `docker compose up` for Postgres+PostGIS, Redis, Mailpit, MinIO. README < 10 min setup.
- [ ] NestJS skeleton: config validation, logging with redaction, error format, request id, health/ready, rate limits.
- [ ] Prisma schema v0 + migrations + seeds (interests, launch city, engine items, match_config v2, soul topics).
- [ ] Flutter `apps/app`: platforms web/android/ios/windows/macos/linux, theme tokens (§5.10), localization en/ru, go_router with path URLs (PLAT‑003), adaptive shell (bottom bar / rail / sidebar), generated API client, platform interfaces (PLAT‑001), state widgets, PWA manifest + service worker (PLAT‑005).
- [ ] CI: API tests + build, Flutter analyze/test, web build, Android APK. Optional jobs for iOS/desktop. Deploy alpha (web + API) from `main`.
- [ ] ADRs: hosting, auth (incl. web cookies), geo (H3 + PostGIS), storage, AI provider + data terms, analytics, psychometric instruments & licences, payments, web renderer.
- **Exit:** fresh clone runs locally < 10 min. The alpha URL shows the app shell on desktop and phone. CI green.

**M1: Identity + invites**: AUTH‑001..005, ONB‑001..003, ONB‑002a, ALPHA‑001, S1–S6, S41. **Exit:** invite → sign‑up → age gate → consents on web and Android.

**M2: Soul Engine core (the heart)**: ENG‑001, 002, 005–010, 016, ALPHA‑005. S7–S12. Founder reviews band and archetype texts. **Exit:** Quick Scan → reveal → DNA card on all breakpoints. Engine coverage ≥ 95%. Determinism snapshot test passes.

**M3: Profile & photos**: PROF‑001..003, S13–S16, S36, S44. **Exit:** public DTO contract + EXIF tests. Photo upload works on web (file picker + drag & drop) and Android (camera + gallery).

**M4: Matching & Today's Souls**: ENG‑011..014, ENG‑015 (collection), GEO‑001, LIKE‑001..003, ALPHA‑002, S17, S18, S23, S24. **Exit:** a new tester sees a full daily set (with demo profiles) and can match. Golden persona pairs approved.

**M5: Chat, notifications & safety**: CHAT‑001..003, LIKE‑004, SAFE‑001..005, NOTIF‑001 (in‑app centre + Android push), admin panel incl. invites and feedback ([15](15-admin.md)), ALPHA‑004, S25, S38, S40, S42, S43. **Exit:** realtime chat between web and Android. Block/unmatch enforced. Report → admin → action works.

**M6: Reports (free in alpha)**: RPT‑001..003 (paywall flag off), report writer + templates, ALPHA‑006, S26, S30, share level in settings. **Exit:** self and pair reports on all breakpoints. Share‑level reciprocity tests pass.

**M7: Nearby Now**: GEO‑002..007, PLAT‑007, ALPHA‑003, S19–S22, S45. **Exit:** two Android phones nearby get one alert each. Two web testers using the simulator get an alert. Location privacy tests pass.

**→ A1: ALPHA RELEASE** (ALPHA‑007..010, ACC‑003 deletion, analytics with consent, Sentry, download page). Pass the Alpha gate [19 §19.1](19-acceptance-checklists.md). Invite friends. Run 2–3 weeks. Triage feedback weekly.

**M8: Deep Personality & Soul Talk**: ENG‑003, SOUL‑001..008, encryption service, SSE on all platforms, safety + crisis resources, eval sets, purge job, S27–S29, S31–S34. **Exit:** crisis eval 100%, no‑plaintext and owner‑only tests pass. (May ship to alpha testers once crisis texts are approved.)

**M9: Payments & operations**: PAY‑001..003 (RevenueCat mobile, flag off), web push (D36), ACC‑001..002, retention/purge jobs, backup/restore drill, threat model, runbooks, staging + production environments, iOS TestFlight. **Exit:** sandbox purchase + restore on Android/iOS, export works, staging and production live.

**M10: Closed beta**: production, no demo profiles, invite‑based, paywall off, metric dashboard. **Exit:** beta gate + founder go/no‑go. Decide paywall timing and prices.

**M11+: Public launch work (P1)**: paywall on (A/B prices), Web Billing, signed desktop builds, Apple/Google sign‑in, "Did you meet?" learning loop, Level 3/4 questionnaires, share card, store listings.

## 18.6 Alpha success signals (the founder decides with these)
| Signal | Healthy hypothesis |
|---|---|
| Invite → completed onboarding | ≥ 70% |
| Quick Scan completion (of starters) | ≥ 75% |
| Reveal accuracy rating | average ≥ 4.0 / 5 |
| Testers with ≥ 1 match with a real tester | ≥ 50% |
| Matches with ≥ 3 messages each side | ≥ 30% |
| Pair report "matched my impression" | average ≥ 3.8 / 5 |
| Crash‑free sessions | ≥ 99% |
| Top 3 feedback themes | documented with decisions |
