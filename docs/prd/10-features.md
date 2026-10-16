> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 10. Functional requirements: other modules

Format: **ID: title (priority)**, rules, **AC**.

## 10.1 Authentication & sessions (AUTH)

**AUTH-001: Request login code (P0)**: `POST /v1/auth/code` {email}. Normalize (trim, lowercase), validate format. Always `202` with the same body (no account enumeration). Code: 6 random digits (CSPRNG), stored hashed, TTL 10 min, max 5 attempts. Rate limits: 3 codes per email per 15 min, 10 per IP per hour, resend cooldown 60 s. **AC:** known and unknown emails get identical responses. 4th request in 15 min → `429` with `retry_after`.

**AUTH-002: Verify code / create account (P0)**: `POST /v1/auth/verify` {email, code, device_id, invite_code?}. When `INVITE_ONLY=true`, a new account requires a valid unused invite code (ALPHA‑001). Existing accounts don't. Valid → create user if new (status `onboarding`) → access + refresh tokens. Constant‑time compare, code deleted after use. **AC:** 5 wrong attempts invalidate the code. Reuse fails. Expired fails.

**AUTH-003: Refresh & rotation (P0)**: `POST /v1/auth/refresh` → new pair, old refresh invalid. Reuse of a used refresh token revokes the whole family + security event. Native apps store tokens only in Keychain/Keystore/OS credential store (`flutter_secure_storage`). Web: refresh token in an httpOnly cookie, access token in memory (PLAT‑004). **AC:** integration tests for rotation and reuse.

**AUTH-004: Logout (P0)**: `POST /v1/auth/logout` (current), `POST /v1/auth/logout-all`. Deletion and suspension revoke all.

**AUTH-005: Sensitive actions (P0)**: email change and account deletion require a fresh code (`purpose=sensitive_action`). Email change: code to the new address + notice to the old one.

**AUTH-006: Apple / Google sign‑in (P1)**: link by verified email only.

## 10.2 Age gate & consent (ONB)

**ONB-001: Age gate (P0)**: DOB required, server computes age. < 18 → `blocked_underage`, dating features denied, neutral screen. DOB editable only via support. Public: age only. **AC:** every dating, engine‑report and nearby endpoint returns `403 AGE_GATE` without a passed age gate.

**ONB-002: Consents (P0)**
- Required: Terms + Privacy (versioned).
- Optional, unticked: product emails, analytics, **AI writing** (DNA card + report prose: if declined, templates are used and no data goes to the AI provider), **AI Self‑Discovery** (Soul Talk, asked on first entry to Soul Talk).
- Share level (RPT‑003) asked as its own step.
- Store type, version, granted/withdrawn, timestamp. Withdraw in Settings. A new Terms version must be re‑accepted before dating features.

**ONB-002a: Alpha terms (ALPHA)**: on `APP_ENV=alpha` an extra required consent: "This is a test version. Things may break, and test data may be reset with 48 h notice. Please don't share screenshots of other testers' profiles."

**ONB-003: Onboarding progress (P0)**: `users.onboarding_step` server‑side. Optional steps skippable. Progress bar.

## 10.3 Profile (PROF)

**PROF-001: Fields (P0)**
| Field | Rules |
|---|---|
| first_name | 1–30 chars, letters/space/hyphen, no URLs/handles |
| dob | 18+ |
| gender / interested_in | enums D25 |
| intent | enum D26 |
| bio | 0–300 chars, URLs/phones/@handles rejected |
| interests | 3–10 from the curated list (`interests`, localized) |
| photos | 2–6 (PROF‑002) |
| age_min / age_max | 18–99, default ±5 years (clamped at 18) |
| city | coarse city id from a list (or derived once from location) |
| optional facts | height, job title (≤40), education, pets |
- Server‑side DTO allowlists. Unknown fields → `400`. No mass assignment.
- **AC:** the public profile DTO contains only: id, first_name, age, photos (signed URLs), bio, interests, intent, filled optional facts, archetype, DNA card (if visible to the viewer), distance band or city, activity tag (if open), tier + reasons for this viewer, verified badge (P1). Contract test enforces it.

**PROF-002: Photos (P0)**: `POST /v1/photos/upload-url` → client PUT to a quarantine prefix → `POST /v1/photos/{id}/complete` → worker validates real type (magic bytes: JPEG/PNG/HEIC/WebP), ≤ 10 MB, ≥ 400×400 → re‑encodes to WebP (max 1600 px), strips metadata, random key, deletes the original. Reorder, delete, min 2 while discovery is on. **AC:** a test image with GPS EXIF has none after processing.

**PROF-003: Completeness (P0)**: owner‑only percentage with tips. Never used for ranking beyond the minimum requirements.

## 10.4 Likes & matches (LIKE)

**LIKE-001: Like / pass (P0)**: `POST /v1/likes` {target_id, action, source: daily|nearby|profile}. Idempotent (unique actor+target). Actor from the token only. Target must be eligible and present in the viewer's daily set or nearby list (prevents scraping by id). Anti‑spam: 50 likes/day, 20 for accounts < 48 h. **AC:** liking an ineligible user → `404`.

**LIKE-002: Mutual match (P0)**: one transaction, unique `(user_low, user_high)`. Concurrent mutual likes → exactly one match (parallel test). Push "It's a match! 🎉" (no name on the lock screen by default). Pair report teaser generated asynchronously.

**LIKE-003: Matches list (P0)**: new matches row, conversations by last message, unread badges.

**LIKE-004: Unmatch (P0)**: removes the conversation for both, stops messaging, deletes the pair report, pair never shown again. Messages hidden and kept `MOD_RETENTION_DAYS=90` for safety, then deleted.

## 10.5 Chat (CHAT)

**CHAT-001: Messaging (P0)**: text ≤ 1000 chars + emoji. Only participants of an active match (checked on every request and socket event). `client_message_id` dedupe. States: sending → sent → read (read receipts toggleable). Rate limits: 30/min per conversation, 300/day for accounts < 48 h. Links/phone numbers in the first 3 messages trigger a safety tip for the receiver. Pagination 50. **AC:** non‑participant → `404`. After block/unmatch, send fails immediately.

**CHAT-002: Realtime (P0)**: socket authenticated on connect and reconnect. Events `message.new`, `message.read`, `match.new`, `match.ended`, `report.ready` (pair report generated). REST polling fallback every 10 s.

**CHAT-003: Conversation starters (P0 in pair teaser, P1 in‑chat)**: starters come from the pair report (shared reasons, interests). Tapping one fills the input, the user can edit, the user presses Send. **Never auto‑send.**

## 10.6 Discovery, location & Nearby Now (GEO)

**GEO-001: Discovery switch (P0)**: default **off**. Off → removed from new daily sets and alerts within 1 min, location deleted.

**GEO-002: Location permission (P0)**: via `LocationService` (PLAT‑007): mobile OS permission, browser Geolocation API on web (HTTPS, triggered by a user tap). Asked only when the user turns on Open to meet (or opts in to distance in the daily set), after an explanation screen (approximate area, others see a range, only latest area kept, deleted within 24 h). Denied → everything else works. Don't ask again more than once per 7 days.

**GEO-003: Location updates (P0)**: `POST /v1/location` {lat, lng, accuracy_m, captured_at} only in the foreground with discovery on: on open, on resume, every 5 min while Open to meet. Server converts to H3 res 9, stores `cell_id` + cell centre in `user_locations` (one row per user, overwritten), discards raw coordinates (never logged). Reject `accuracy_m > 500`. Flag `speed > 300 km/h` (keep previous location, security event). Max 30 updates/hour. `location_fresh` = updated within 15 min.

**GEO-004: Distance bands (P0)**: computed server‑side between snapped centres → band (D28). Never send coordinates, cell ids or metres to other users. Band cached 30 min per viewer→candidate pair. `hide_distance=true` → others see "Nearby" (alerts) or the city (daily set). **AC:** contract test: no response to another user contains `lat`, `lng`, `cell`, `distance_m`. Trilateration test: 3 spoofed viewer positions can't narrow a target below the H3 cell size.

**GEO-005: Open to meet (P0)**: `POST /v1/nearby/open` {duration 60|120|240, radius_m, activity?}. Server stores `open_until` and ends it by job (server is the source of truth). `POST /v1/nearby/close`. Max 3 sessions/day. **AC:** client clock manipulation can't extend the window.

**GEO-006: Nearby matcher & alerts (P0)**: worker every 2 min and on each open user's location update. Pairs: both open, both fresh, distance ≤ min(radiusA, radiusB), eligible both ways (ENG‑011), compatibility ≥ `NEARBY_MIN_SCORE` (55), no alert for the pair in 7 days. One alert to both after a random 0–3 min delay. Max 5 alerts per user per window. Copy: title "Someone compatible is nearby ✨", body "Open NearSoul to see who. {band}." Never "wants to meet you". **AC:** two seeded open users 600 m apart, radius 1 km, compatible → exactly one alert each. Blocked or incompatible‑intent pair → none. No repeat within 7 days.

**GEO-007: Nearby card & Later list (P0)**: card: photos, name, age, band, activity, tier, 1–3 reasons, archetype, DNA card (if visible). Yes / No / Later. Later → Nearby list until the window ends. Mutual Yes → "You're both nearby 👋".

## 10.7 Soul Talk: AI self‑discovery (SOUL)

| Soul Talk IS | Soul Talk IS NOT |
|---|---|
| Guided self‑reflection, one question at a time | Therapy, diagnosis, mental‑health treatment |
| Mirroring back what the user said | Advice nobody asked for |
| Private, encrypted, owner‑only | Shared with matches, staff or advertisers |
| A neutral guide without a human name | A friend, companion or romantic partner |

**SOUL-001: Topics (P0)**: versioned in `soul_topics` (key, title, description, goal, opening question, 5–8 angles, `allowed_trait_keys`, max turns). MVP topics:
| key | Title | May suggest traits (L2–L5 only) |
|---|---|---|
| `looking_for` | What am I really looking for? | values, independence_need (intent only as a suggestion to open settings) |
| `energy` | What gives me energy | weekend_style, activity_level, spontaneity |
| `communication` | How I connect and handle conflict | texting_rhythm, conversation_depth, conflict_style |
| `past_lessons` | What my past relationships taught me | conflict_style, independence_need, reassurance_need, care_language |
| `values` | My values and non‑negotiables | values, kids_plan (dealbreakers only as a suggestion) |
| `lifestyle` | My ideal week | activity_level, drinking, smoking, spontaneity |
| `cared_for` | What makes me feel cared for | care_language, affection_expression |
| `future_self` | Who I want to become | life_direction, values |
The Soul tab suggests the next topic by the lowest‑confidence layer.

**SOUL-002: Session (P0)**: opening question prewritten (no LLM call). Each turn: user message (≤ 2000 chars) → safety check → guide reply streamed via SSE (≤ 600 chars, a reflection + exactly one question, up to 3 quick‑reply chips). Soft 6–12 turns, wrap‑up after turn 10, hard cap 20. End any time (≥ 2 turns for insights). Resume for 7 days. Context: system prompt + topic angles + up to 10 kept insights + rolling summary + last 8 turns. Errors: timeout 20 s → retry button, user message kept, never fake replies. **AC:** kill app mid‑session → full history on reopen. Retry doesn't duplicate (idempotency key).

**SOUL-003: Wrap‑up & insights (P0)**: separate call → JSON: `summary` ≤ 500, `insights` 1–5 `{text ≤140, category: value|need|pattern|strength|preference|growth, evidence ≤160, trait_suggestion?: {trait_key ∈ allowed, value ∈ allowed}}`, `question_to_sit_with` ≤ 140. Validation: schema, lengths, whitelist, banned terms. Nothing saved automatically: each insight is `proposed` until **Keep / Edit / Discard**. **AC:** a disallowed trait key is dropped, the insight kept without it.

**SOUL-004: Soul Map (P0)**: private page: Soul Profile summary, kept insights by category, timeline. Insight visibility: `private` (default) · `matching` (its trait suggestion updates L2–L5 via ENG‑008. The text is never shown to others) · `card` (text may be used in DNA card regeneration and in pair reports at `deep` share level, after preview/approval). Edit/delete any time. Deleting reverts its trait effect. **AC:** `matching` → `private` removes the trait effect.

**SOUL-005: Conflicts with questionnaire answers (P0)**: per‑trait `source` + `updated_at`. The most recent user‑confirmed value wins. The Soul Profile shows "Updated from your Soul Talk on {date}". Intent and dealbreakers are never changed from Soul Talk: a button opens the regular settings.

**SOUL-006: Safety & wellbeing (P0, release‑blocking)**
- Not therapy: stated on the intro. "This isn't therapy" link in the session header.
- Every user message is checked *before* the reply (`SOUL_SAFETY_MODEL` + per‑locale keyword backup) for `self_harm`, `harm_to_others`, `abuse_or_danger`, `underage`, `medical_emergency`.
- On risk: **no generated reply**. Show the fixed, founder‑approved message + `CRISIS_RESOURCES` for the user's country + Continue / End. `safety_events` row (category + time, no content). Nobody notified. `underage` → account flagged for age review, session ended.
- No companionship: no human name/face, no "I love/miss you", no flirting, never discourages real relationships or professional help. Gentle "take a break" after 45 min/day.
- No manipulation: no upsells inside a session (the weekly free limit is shown only *before* starting a session), no pushing to like/match.
- Other people: non‑judgmental, never encourages contacting/tracking anyone, never asks for identifying details.
- Jailbreaks declined politely, session continues.
- **AC:** the Soul eval set (§14.6) passes 100% on crisis cases before any real users.

**SOUL-007: Privacy (P0, release‑blocking)**: data class **S3 Intimate**.
- Owner‑only. No admin/support/moderator UI or API. Never in reports to staff, logs, Sentry, analytics, push, email.
- App‑level encryption (AES‑256‑GCM) with a per‑user data key wrapped by a master key from the secret store/KMS. Account deletion deletes the key first (crypto‑shred).
- Transcripts auto‑deleted 90 days after the session (unless "Keep my conversations"). Summaries and kept insights stay until deleted. One‑tap delete per session / all.
- Separate AI Self‑Discovery consent. Withdrawal stops new sessions and offers deletion.
- Sent to the provider: current session, topic, short kept insights, locale. Never: email, DOB, location, photos, match chats, other users' data. No training on this data. Provider retention terms in an ADR.
- Included in the owner's data export.
- **AC:** no plaintext in DB columns (test). No message text in logs/Sentry/analytics from a Soul integration test (scan). Route inventory test: no admin route returns Soul data.

**SOUL-008: Limits (P0)**: free 3 sessions/week (counts only when `PAYWALL_ENABLED`), Soul+ fair use 3 sessions/day. All: 20 turns/session, 60 messages/hour, `SOUL_USER_DAILY_TOKENS`. Global `AI_DAILY_BUDGET_USD`: 80% → alert. 100% → "Soul Talk is resting for a bit".

**SOUL-009..011 (P1)**: daily reflection question (push off by default) · "Ask about yourself" (answers only from the owner's own Soul Map, cites insights, careful language) · free talk topic.

## 10.8 Safety & moderation (SAFE)

**SAFE-001: Block (P0)**: from profile, card, chat, pair report. Instant, permanent, both directions (daily sets, nearby, chat, likes, reports). Not notified. Unblock in Settings (no automatic re‑match).

**SAFE-002: Report (P0)**: categories: harassment, scam/spam, fake profile/impersonation, underage, inappropriate photos, threats/violence, offline behaviour, other. Comment ≤ 500. Status `open → in_review → actioned | dismissed`. Reporting also blocks by default. `underage` and `threats` → **urgent** (top of queue + admin email).

**SAFE-003: Automatic protections (P0)**: ≥ 3 distinct reporters in 7 days → auto‑hidden pending review. New‑account limits. URLs/phones blocked in name/bio. Scam keyword list flags for review. Exact photo hash denylist (perceptual P1). Engine signal: straight‑lined Quick Scan + new account + many likes → flag for review (not auto‑ban).

**SAFE-004: Admin moderation (P0)**: §15.

**SAFE-005: Safety centre (P0)**: tips (meet in public, tell a friend), how to block/report, emergency number for the launch country.

**SAFE-006: Photo verification (P1)**: selfie vendor → "Verified" badge, filter "verified only".

## 10.9 Notifications (NOTIF)

**NOTIF-001 (P0)**: an **in‑app notification centre** (bell icon, unread badge, `GET /v1/notifications`) exists on every platform and stores every event below. Push is an additional channel (PLAT‑006). Types: `daily_set_ready`, `nearby_alert`, `new_match`, `new_message`, `open_ending` (10 min left), `report_update`. Each toggleable. Lock screen generic by default ("New message"). "Show previews" off by default. Deep links re‑check auth and authorization. Device tokens per session, removed on logout. Quiet hours (default 23:00–08:00) except messages in active conversations (`CONFIRM`). Max 1 non‑conversation push per day (§5.8).

## 10.10 Settings, privacy & account (ACC)

**ACC-001: Settings (P0)**: Profile edit · Soul (retake Quick Scan, Deep progress, edit layer traits, DNA card, share level) · Discovery (on/off, age, feed radius, flexible fallback) · Privacy (hide distance, read receipts, card visibility, analytics, AI consents) · Soul Talk data · Notifications · Blocked users · Soul+ (status, restore, manage) · Safety centre · Help · Legal · Account (email, logout, logout all, export, delete).

**ACC-002: Data export (P0)**: job builds JSON + photos ZIP (incl. answers, Soul Profile, reports, decrypted Soul Talk) → signed link by email (24 h). Max 1 per 7 days.

**ACC-003: Account deletion (P0)**: flow §7.10. `active → deletion_requested → deleted`. Immediately: invisible, sessions revoked, Soul data key deleted. Job deletes profile, photos, engine answers, Soul Profile, reports, insights, location, likes, device tokens, daily sets. Messages show "Deleted user" to the other person and are removed after `MOD_RETENTION_DAYS` unless under an open report. Reports/audit kept anonymized as required (`CONFIRM` legal). Store subscription: we notify the user that cancellation happens in the store. Idempotent.

## 10.11 Analytics (ANL)

**ANL-001 (P0)**: through `AnalyticsService` only, only with consent. Allowed: random analytics id, platform, app version, coarse city id, step names, counts, tiers, archetype key, band names, `engine_version`, `match_config_version`. **Forbidden:** email, name, coordinates, cell ids, answers, raw scores, message text, Soul Talk content/insight text, report comments.
- Events: `onboarding_started`, `code_requested`, `code_verified`, `age_gate_passed`, `consent_given`, `quick_scan_started`, `quick_scan_block_completed`, `quick_scan_completed`, `soul_profile_revealed`, `archetype_assigned` (key), `deep_part_completed` (n), `dna_card_viewed`, `dna_card_visibility_changed`, `share_level_set` (level), `profile_completed`, `discovery_enabled/disabled`, `daily_set_viewed`, `daily_set_completed`, `candidate_viewed` (tier), `like_sent`, `pass_sent`, `match_created` (source, tier), `first_message_sent`, `conversation_reached_10_messages`, `starter_used`, `location_permission_result`, `open_to_meet_started/ended`, `nearby_alert_received/opened`, `nearby_action`, `self_report_opened`, `pair_teaser_viewed`, `locked_section_tapped` (section), `paywall_viewed` (trigger), `purchase_started/completed/failed` (product), `restore_completed`, `subscription_cancelled` (from webhook), `soul_consent_given`, `soul_session_started` (topic), `soul_session_finished` (turns, ended_by), `soul_insight_reviewed` (action, category, visibility), `soul_map_viewed`, `block_created`, `report_submitted`, `account_deletion_requested`.
- `docs/analytics-events.md` for each: purpose, properties, retention.

**Metrics.** North Star: *mutual conversations per weekly active user* (both sent ≥ 3 messages). Engine: Quick Scan completion, reveal → profile completion, tier vs. like/match/conversation rates. Self: Soul Talk sessions per WAU, insight keep rate, Deep completion. Money (after paywall): paywall view → purchase conversion, trial/subscription retention, ARPPU, refund rate. Health: D1/D7/D30, report rate per 1,000 users, urgent report response time, crash‑free sessions, AI cost per user.

