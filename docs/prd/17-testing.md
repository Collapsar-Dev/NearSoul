> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 17. Testing strategy

| Level | Minimum |
|---|---|
| **Engine unit + property tests** | item scoring (reverse keys), 0–100 transform, bands in both norm modes, Emotional Stability inversion, consistency and straight‑lining flags, depth formula, archetype mapping (all 11 outcomes + ties), every compatibility formula, symmetry/bounds/determinism (fast‑check), unknown‑data exclusion, intent matrix, dealbreakers, reason/friction selection, share‑level filtering of pair report data, snapshot tests for 20 golden persona pairs |
| **Integration (API + Postgres/Redis in Docker)** | auth (code, verify, refresh rotation/reuse, logout); age gate on all dating routes; Quick Scan save/resume → profile → card fallback; Deep part recompute; recompute invalidates pair caches; public DTO contract; photo EXIF strip; daily set generation incl. fallbacks and stability; each eligibility filter; concurrent mutual likes → one match; chat authorization; block/unmatch cut‑off + pair report deletion; reports: teaser vs full by entitlement and `PAYWALL_ENABLED` in both states; RevenueCat webhook (valid/invalid signature, renew, expire, refund); location TTL/no history; nearby alert scenarios; Soul Talk (session, retry idempotency, insights only after Keep, visibility revert, purge, crypto‑shred, owner‑only); report → admin → action → audit; deletion revokes sessions and hides user |
| **Security** | IDOR on every user‑owned route, mass assignment, admin escalation, admin access to S3/raw S2 (must fail), brute force on codes, token reuse, log scan for sensitive values, malicious uploads, prompt injection (card, reports, Soul Talk), share‑level leakage in reports, scraping profiles by id outside daily set/nearby list, trilateration of distance bands, entitlement bypass (client claims premium), webhook spoofing |
| **AI eval** | §14.6 |
| **Mobile** | widget tests for all screen states, golden tests (reveal, cards, reports, paywall), integration tests (patrol/integration_test): onboarding → reveal, daily set → match → chat, Soul Talk, purchase in sandbox |
| **E2E on real devices** | iOS + Android: full onboarding, Deep part, Today, Open to meet with two phones nearby, mutual match, pair report, sandbox purchase + restore, block/report, delete account |

CI (GitHub Actions): install → format → lint → typecheck → engine tests (coverage gate 95%) → unit → integration (docker compose) → API build → Flutter build (Android debug, iOS no‑codesign) → OpenAPI diff check → Gitleaks.

## 17.1 Platform test matrix
| Platform | Automated | Manual before each Alpha/beta release |
|---|---|---|
| Web: Chrome, Edge, Firefox (desktop) | Flutter web integration tests in CI (headless Chrome) | Full flow on each browser at expanded + medium widths |
| Web: Safari macOS + iOS Safari (PWA installed and not installed) | — | Full flow, PWA install, location prompt, web push (installed PWA) |
| Web: Chrome Android | — | Full flow, PWA install, push |
| Android app (APK) | integration_test / patrol on an emulator in CI | Real device: onboarding, Nearby with two phones, push, photos from camera |
| iOS app (when available) | build in CI | TestFlight on a real device |
| Windows / macOS / Linux native (optional) | build in CI | Smoke test: login, Today, chat, Soul Profile |

Responsive checks: golden tests at 375×812, 768×1024, 1440×900 for key screens. Accessibility: keyboard‑only pass on web (all core flows reachable), screen reader smoke test (VoiceOver/TalkBack/NVDA).
