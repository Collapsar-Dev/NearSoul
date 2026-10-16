> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 2. Decisions & platforms

## 2.1 Decision table (defaults the agent implements)

| # | Topic | Decision (default) | Config / note |
|---|---|---|---|
| D1 | Client app | **Flutter** (Dart 3, stable), one codebase for **Web, Android, iOS, Windows, macOS, Linux**. Riverpod, go_router (URL‑based routes for web deep links), Dio, freezed/json_serializable | §2.2 |
| D2 | Backend | **TypeScript + NestJS** modular monolith, Node LTS | — |
| D3 | Database | **PostgreSQL 16 + PostGIS**, Prisma for schema/migrations (raw SQL allowed for geo queries) | — |
| D4 | Cache / jobs | **Redis** + BullMQ (jobs, rate limits, nearby matcher, daily set generation) | — |
| D5 | Auth | **Passwordless email one‑time code** (6 digits). Sign in with Apple/Google = P1 | — |
| D6 | Sessions | Access JWT 15 min + opaque refresh token 30 days, rotated on every use, stored hashed, reuse ⇒ revoke the family | `ACCESS_TTL`, `REFRESH_TTL` |
| D7 | Realtime chat | WebSocket via NestJS gateway (Socket.IO), REST fallback | — |
| D8 | Push | Firebase Cloud Messaging (Android + iOS via APNs) | — |
| D9 | Photos | S3‑compatible private bucket (default Cloudflare R2), signed URLs (10 min), server‑side re‑encode (strips EXIF/GPS) | — |
| D10 | Email | Provider behind an interface (default Postmark or Resend). Dev: Mailpit | `EMAIL_PROVIDER` |
| D11 | AI provider | **Anthropic Claude API** behind an internal `AiProvider` interface | `AI_ENABLED` |
| D12 | AI models | Card + report writing: `claude-haiku-4-5-20251001`. Soul Talk conversation + wrap‑up: `claude-sonnet-5-5`. Safety classifier: `claude-haiku-4-5-20251001` | `AI_MODEL_WRITER`, `SOUL_MODEL`, `SOUL_SAFETY_MODEL` |
| D13 | Personality model | **Big Five** using **IPIP** items (public domain): **Mini‑IPIP** (20 items) in the Quick Scan, **IPIP‑NEO‑120** (30 facets) in Deep Personality. MBTI is not used | ADR with sources and licence check |
| D14 | Engine | Pure TypeScript package, deterministic, versioned (`ENGINE_VERSION`), weights in DB config (`match_config`) | §8 |
| D15 | Compatibility display | Tier + reasons by default. Percentage hidden | `SHOW_SCORE_PERCENT=false` |
| D16 | Daily set | **Today's Souls**: 15 curated candidates per day, refreshed at 12:00 local time | `DAILY_SET_SIZE=15` |
| D17 | Payments | Mobile: store in‑app purchases via **RevenueCat**. Web/desktop: RevenueCat Web Billing (Stripe) (P1). Server‑side entitlement check via webhooks. Payments are not needed for the Alpha (paywall off) | — |
| D18 | Paywall | Built in MVP **behind a flag, OFF during the closed beta** ("Free during beta"). Turned on after beta data | `PAYWALL_ENABLED=false` |
| D19 | Prices (hypotheses) | Soul+ €7.99/month or €39.99/year. One‑time: Pair report €2.99 (P1), Full self report €9.99 (P1) | `CONFIRM` |
| D20 | Analytics | PostHog (EU) behind an interface, no PII | `ANALYTICS_ENABLED` |
| D21 | Monitoring | Sentry (mobile + API) with PII scrubbing | — |
| D22 | Hosting | Render (API, worker, Postgres with PostGIS, Redis) in an **EU region**. Flutter web build served as a static site (Render static site or Cloudflare Pages) on HTTPS with a custom domain | ADR, `CONFIRM` domain |
| D23 | Launch market | One EU city (GDPR baseline) | `CONFIRM` `LAUNCH_CITY` |
| D24 | Age | 18+ only, DOB required, server‑enforced. Document age assurance = P1 if the market requires it | `CONFIRM` |
| D25 | Gender model | `gender`: woman / man / non‑binary. `interested_in`: multi‑select of the same. Mutual fit required | — |
| D26 | Relationship intent | `long_term`, `open_to_long`, `casual`, `not_sure` (matrix §8.7) | `CONFIRM` labels |
| D27 | Nearby radius options | **500 m, 1 km, 3 km, 10 km** (no 100 m). Default 1 km | `RADIUS_OPTIONS_M` |
| D28 | Distance shown | Bands only: "Under 500 m", "Under 1 km", "1–3 km", "3–10 km", "10+ km" | §10.6 |
| D29 | Location storage | Only the **latest** snapped location (H3 res 9 ≈ 175 m cell). **No history.** Deleted when discovery is off or after 24 h without updates | `LOCATION_TTL_H=24` |
| D30 | Background location | **Not used** (foreground "while using the app" only) | — |
| D31 | Soul Talk data | Strictest data class S3: app‑level encryption, owner‑only, transcripts auto‑deleted after 90 days unless kept | `SOUL_TRANSCRIPT_TTL_DAYS=90` |
| D32 | Crisis resources | Per‑country hotline list, shown on risk detection | `CRISIS_RESOURCES` JSON, `CONFIRM` |
| D33 | Admin | Minimal React + Vite web panel `apps/admin`, admin‑only API routes, TOTP MFA | — |
| D34 | Repo layout | Monorepo: `apps/app` (Flutter, all platforms), `apps/api` (incl. `src/engine`), `apps/admin`, `packages/contracts` (generated OpenAPI types), `docs/` | — |
| D35 | Web auth storage | Web: refresh token in an **httpOnly, Secure, SameSite=Strict cookie** scoped to the API domain, access token in memory only. Never in localStorage. Native: Keychain/Keystore/OS credential store via `flutter_secure_storage` | PLAT‑004 |
| D36 | Web push | FCM Web Push with a service worker (Chrome, Edge, Firefox, Android). iOS Safari only for installed PWAs (iOS 16.4+). Otherwise in‑app notifications | PLAT‑006 |
| D37 | Alpha access | Invite‑only (`INVITE_ONLY=true`), demo profiles and tester tools on `APP_ENV=alpha` only | [18](18-release-plan.md) |


## 2.2 Platforms: Web, Desktop, Mobile

### 2.2.1 Platform matrix
| Platform | How users get it | Alpha | Closed beta | Public launch |
|---|---|---|---|---|
| **Web** (Chrome, Edge, Firefox, Safari: last 2 versions) | URL, e.g. `alpha.nearsoul.app` | **Required** | Required | Required |
| **PWA** (installable web app on desktop and phones) | "Install app" / "Add to Home Screen" from the web URL | **Required** | Required | Required |
| **Android** (8.0+) | Alpha: APK download link / Firebase App Distribution. Later: Google Play internal → production | **Required** | Required (Play internal testing) | Required |
| **iOS** (16+) | TestFlight (needs an Apple Developer account, `CONFIRM`). Without it, iPhone friends use the PWA | Optional (if the account exists) | Required | Required |
| **Windows** (10+) | Zipped build (MSIX later) from CI artifacts | Optional (nice to have) | Optional | P1 (signed) |
| **macOS** (12+) | `.dmg` from CI artifacts (unsigned in Alpha: right‑click → Open) | Optional | Optional | P1 (signed + notarized) |
| **Linux** | AppImage from CI artifacts | Optional | Optional | P2 |

Desktop users are fully served by the web app/PWA. Native desktop builds are extra.

### 2.2.2 Feature availability by platform
| Feature | Web / PWA | Android / iOS | Windows / macOS / Linux native |
|---|---|---|---|
| Sign‑up, Quick Scan, Soul Profile, Deep Personality | ✓ | ✓ | ✓ |
| Today's Souls, likes, matches, chat (realtime) | ✓ | ✓ | ✓ |
| Reports | ✓ | ✓ | ✓ |
| Soul Talk (SSE streaming) | ✓ | ✓ | ✓ |
| Photo upload | ✓ file picker + drag & drop on desktop | ✓ camera + gallery | ✓ file picker |
| **Nearby Now** | ✓ if the browser grants geolocation (HTTPS). Desktops without GPS: allowed, accuracy check applies (GEO‑003 rejects > 500 m) | ✓ | ✓ only if the OS location service is available, otherwise the Nearby tab explains "Nearby works best on your phone" |
| Push notifications | ✓ Web Push (D36), else in‑app badge + notification centre | ✓ FCM | ✓ in‑app notification centre (OS notifications P1) |
| Purchases (when paywall on) | P1 via Web Billing | ✓ store IAP | P1 via Web Billing |
| Share archetype card (P1) | Web Share API / download image | native share sheet | download image |

### 2.2.3 Platform requirements

**PLAT-001: One codebase (ALPHA)**: one Flutter project `apps/app` with platform folders for web, android, ios, windows, macos, linux. Platform‑specific code isolated behind interfaces in `lib/platform/` (storage, push, location, file picking, purchases). No feature logic duplicated per platform.

**PLAT-002: Responsive layouts (ALPHA)**: every screen implements the three breakpoints in [05 §5.9](05-ux-and-design.md). AC: golden tests per breakpoint for key screens (reveal, Today, candidate profile, chat, Soul Profile, pair report).

**PLAT-003: Web routing & deep links (ALPHA)**: path‑based URLs (no `#`): `/today`, `/nearby`, `/soul`, `/soul/talk/{sessionId}`, `/matches`, `/matches/{matchId}`, `/matches/{matchId}/report`, `/me`, `/settings/...`, `/invite/{code}`. Browser back/forward works. Refreshing any URL restores the screen (after an auth check). Unauthorized URLs redirect to login, then return to the target. Mobile deep links use the same paths (`https://<domain>/...` App Links / Universal Links, P1).

**PLAT-004: Auth token storage (ALPHA)**: web follows D35 (httpOnly cookie refresh, in‑memory access, CSRF protection via SameSite=Strict + `X-Requested-With` header check on the refresh endpoint). The API and web app use sibling subdomains of the same registrable domain (e.g. `app.` and `api.`). CORS allows only the app origins per environment. Native follows D35.

**PLAT-005: PWA (ALPHA)**: web manifest (name, icons 192/512 + maskable, theme colour, `display: standalone`), service worker that caches the app shell for fast loads and shows an offline screen. **No caching of API responses containing personal data.** "Install app" hint shown once on the second visit (dismissable).

**PLAT-006: Notifications by platform (ALPHA: in‑app + Android push. Web push P0)**: an in‑app notification centre (bell icon) exists on all platforms and is the source of truth. Push is an extra channel: FCM on Android/iOS, Web Push per D36. Permission is asked only after a meaningful moment (first match or turning on Nearby), never on first load.

**PLAT-007: Location by platform (ALPHA)**: one `LocationService` interface: mobile uses `geolocator` (while‑in‑use permission), web uses the browser Geolocation API (requires HTTPS, user gesture to trigger the prompt), native desktop uses the OS service when available. All send the same `POST /v1/location` payload. All GEO rules apply unchanged.

**PLAT-008: Desktop input (ALPHA for web desktop)**: hover states, visible focus rings, full keyboard navigation (Tab/Shift+Tab, Enter, Esc closes dialogs), `Enter` sends a chat message and `Shift+Enter` adds a new line. Like/pass are **not** bound to single keys (prevents accidental likes). Scrollbars visible on desktop. Text selectable in chat.

**PLAT-009: Performance budgets (ALPHA)**: web initial load ≤ 4 s on a mid‑range laptop over 4G (CanvasKit or skwasm renderer chosen by measurement, ADR). Lazy‑load heavy screens (reports, Soul Talk). Images served in WebP at the needed size. Mobile cold start ≤ 2.5 s.

**PLAT-010: Builds in CI (ALPHA: web + Android. Others optional)**: GitHub Actions jobs produce: web build (deployed to the environment), Android APK (alpha) / AAB (beta), iOS build (when signing secrets exist), Windows zip, macOS dmg, Linux AppImage as downloadable artifacts. The build number and environment are shown in Me → About.

## 2.3 Environments
| Env | `APP_ENV` | Purpose | Data | Special |
|---|---|---|---|---|
| Local | `development` | Developer machine | Seeds + fakes | Mailpit, MinIO, fake AI provider allowed |
| Test/CI | `test` | Automated tests | Ephemeral | Fakes allowed |
| **Alpha** | `alpha` | **Friends test** | Real testers + demo profiles. May be reset with 48 h notice | Invite‑only, demo profiles, tester tools, "TEST VERSION" badge, real email + real AI with a low daily budget |
| Staging | `staging` | Pre‑release checks for beta/prod | Synthetic | Mirrors production config |
| Production | `production` | Closed beta → public | Real | No demo profiles, no tester tools (compile‑time and runtime guarded) |

Each environment has its own database, bucket, secrets, Firebase project, RevenueCat project and domain.
