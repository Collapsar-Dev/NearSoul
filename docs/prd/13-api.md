> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 13. API (REST, `/v1`, JSON)

Conventions: OpenAPI 3.1 (`docs/api/openapi.yaml`) is the source of truth. Error format `{ "error": { "code", "message", "request_id" } }`. Cursor pagination (max 50). `Idempotency-Key` on creates. `Authorization: Bearer`. **Never trust client‑sent** user_id, role, status, scores, entitlement or ownership.

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/code` · `POST /auth/verify` · `POST /auth/refresh` · `POST /auth/logout` · `POST /auth/logout-all` |
| Me / account | `GET /me` · `PATCH /me` · `POST /me/dob` · `GET/POST /me/consents` · `PATCH /me/share-level` · `POST /me/email-change` · `POST /me/export` · `POST /me/delete` · `GET /me/delete/status` |
| Profile | `GET/PATCH /me/profile` · `GET /profiles/{id}` (public DTO, eligibility + context checked) |
| Photos | `POST /photos/upload-url` · `POST /photos/{id}/complete` · `PATCH /photos/order` · `DELETE /photos/{id}` |
| Reference | `GET /interests` · `GET /cities` |
| **Engine** | `GET /engine/questionnaires/{quick_scan|deep_1..4}` · `PUT /engine/answers/{itemKey}` · `GET /engine/progress` · `GET /me/soul-profile` · `PATCH /me/soul-profile/layers` (edit L2–L5 traits) · `POST /me/soul-profile/retake` |
| Card | `POST /me/card/generate` · `GET /me/card` · `PATCH /me/card` · `POST /me/card/preview` (with `card` insights) |
| Discovery | `PATCH /me/discovery` · `GET /daily-set` · `POST /location` |
| Nearby | `POST /nearby/open` · `POST /nearby/close` · `GET /nearby/status` · `GET /nearby/list` · `POST /nearby/later` |
| Likes / matches | `POST /likes` · `GET /matches` · `DELETE /matches/{id}` |
| **Reports** | `GET /reports/self` (free summary or full by entitlement) · `GET /matches/{id}/report` (teaser or full by entitlement + share levels) · `POST /matches/{id}/report/regenerate` (rate‑limited) |
| **Billing** | `GET /billing/status` · `POST /billing/webhook` (RevenueCat, signature‑verified, no user auth) · `GET /billing/offerings` (products + paywall flag) |
| Chat | `GET /matches/{id}/messages` · `POST /matches/{id}/messages` · `POST /matches/{id}/read` · WebSocket `/ws` |
| Soul Talk | `GET /soul/topics` · `POST /soul/sessions` · `GET /soul/sessions` · `GET /soul/sessions/{id}` · `POST /soul/sessions/{id}/messages` (SSE) · `POST /soul/sessions/{id}/finish` · `DELETE /soul/sessions/{id}` · `DELETE /soul/data` · `GET /soul/insights` · `PATCH /soul/insights/{id}` · `GET /me/soul-map` · `PATCH /me/soul-settings` |
| Safety | `POST /blocks` · `GET /blocks` · `DELETE /blocks/{userId}` · `POST /reports-moderation` |
| Devices | `POST /devices` · `DELETE /devices/{id}` |
| Notifications | `GET /notifications` · `POST /notifications/read-all` · `POST /notifications/{id}/read` |
| Invites (ALPHA) | `POST /invites/validate` {code} · `GET /me/invites` (my codes) · `POST /me/invites` (create one, uses `invites_left`) |
| Feedback (ALPHA) | `POST /feedback` (multipart: fields + optional screenshot) |
| Alpha tools (`APP_ENV=alpha`, role `tester` only, else 404) | `POST /alpha/location` {preset_id or lat/lng} · `POST /alpha/daily-set/reset` · `GET /alpha/engine-debug/me` · `GET /alpha/engine-debug/match/{id}` |
| Admin (`/admin/v1`, separate auth + MFA) | `GET/POST /invites` · `GET /feedback` · `PATCH /feedback/{id}` · `GET /queue` · `GET /cases/{id}` · `POST /cases/{id}/assign` · `POST /cases/{id}/resolve` · `GET /users/{id}` · `POST /users/{id}/actions` · `GET /audit` · `GET /metrics/aggregate` |
| Health | `GET /health` · `GET /ready` |

**Authorization test matrix (every endpoint with user‑owned data):** owner allowed · other user `404` · unauthenticated `401` · suspended/deleted/underage denied · id substitution fails · unknown writable fields rejected · normal tokens can't call admin routes · **admin tokens can't call Soul Talk or raw engine‑answer routes** · paid content without entitlement returns only free content.

**Rate limits (configurable):** auth/code 3/15 min/email · verify 5/code · answers 300/h · likes 50/day · messages 30/min/conversation · reports‑moderation 10/day · location 30/h · daily‑set 60/h · card generate 5/day · report regenerate 3/day/pair · Soul sessions 3/day · Soul messages 60/h.

