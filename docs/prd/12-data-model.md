> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 12. Data model (PostgreSQL)

UUID v7 keys, `timestamptz`. Final schema in Prisma + ADR. Constraints listed are required.

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, email (citext unique), status (`onboarding/active/suspended/blocked_underage/deletion_requested/deleted`), onboarding_step, dob, age_gate_passed_at, discovery_enabled, hide_distance, read_receipts, card_visibility, share_level, soul_keep_conversations, flexible_fallback, locale, timezone, billing_id, analytics_id, created_at, last_active_at | email never public |
| `auth_codes` | id, email, purpose, code_hash, attempts, expires_at, used_at | — |
| `sessions` | id, user_id, family_id, refresh_token_hash, device_id, platform, created_at, last_used_at, revoked_at, replaced_by | — |
| `device_tokens` | id, session_id, fcm_token, platform | — |
| `consents` | id, user_id, type, version, value (jsonb, e.g. share level), granted, created_at | append‑only |
| `profiles` | user_id PK, first_name, gender, interested_in[], intent, bio, age_min, age_max, city_id, height_cm, job_title, education, pets, completeness | checks on ages |
| `photos` | id, user_id, storage_key, position, status, sha256, width, height | ≤ 6 |
| `interests`, `profile_interests`, `cities` | as named | seed data |
| `engine_items` | id, item_key, instrument, version, layer, dimension, facet, keyed, type, prompt (jsonb), options (jsonb), active | unique (item_key, version) |
| `engine_answers` | user_id, item_id, value (jsonb), answered_at | PK (user_id, item_id). Data class S2 |
| `soul_profiles` | user_id PK, profile (jsonb `SoulProfile`), archetype, depth, engine_version, norms_version, profile_version (int, increments), computed_at | S2. Never returned to other users raw |
| `layer_overrides` | user_id, trait_key, value, source (`user_edit/soul_talk`), insight_id?, updated_at | PK (user_id, trait_key) |
| `norm_tables` | version, locale, dimension, percentiles (jsonb), sample_size, created_at | — |
| `match_config` | version, config (jsonb: weights, tables, thresholds), active, bucket_rule | — |
| `personality_cards` | user_id PK, headline, summary, communication_style, ideal_first_date, strengths[], source, model, prompt_version, user_edited, visible, generated_at | — |
| `daily_sets` | user_id, date, candidate_ids[] (ordered), match_config_version, generated_at | PK (user_id, date) |
| `pair_scores` | user_low, user_high, score, tier, layer_scores (jsonb), reasons[], frictions[], confidence, engine_version, config_version, computed_at | cache, invalidated on recompute |
| `reports` | id, type (`self/pair`), owner_id, other_id?, match_id?, effective_share_level, sections (jsonb), source_versions (jsonb), model, prompt_version, generated_at | pair reports deleted on unmatch/block/deletion |
| `entitlements` | user_id, entitlement (`soul_plus`), product_id, store, environment, active, expires_at, updated_at | from RevenueCat webhooks |
| `purchases` | id, user_id, product_id, type, store_transaction_id (unique), pair_match_id?, created_at | one‑time unlocks (P1) |
| `user_locations` | user_id PK, h3_cell, point (geography), updated_at | no history, GIST index, TTL job |
| `nearby_sessions` | id, user_id, radius_m, activity, started_at, open_until, ended_at | — |
| `nearby_alerts` | id, user_a, user_b, band, score, sent_at | 7‑day rule |
| `nearby_later` | user_id, target_id, session_id, created_at | cleared at window end |
| `likes` | id, actor_id, target_id, action, source, created_at | unique (actor, target) |
| `matches` | id, user_low, user_high, created_at, ended_at, ended_by, end_reason | unique pair, check low < high |
| `messages` | id, match_id, sender_id, client_message_id, body, created_at, read_at, hidden_at | unique (sender, client_message_id) |
| `pair_outcomes` | id, user_low, user_high, shown_at, liked_a, liked_b, matched_at, first_msg_at, ten_msgs_at, met (P1), tier, config_version | engine learning loop (aggregate analysis only) |
| `soul_topics` | id, key, version, title, description, goal, opening, angles, allowed_trait_keys[], max_turns, active | — |
| `soul_sessions` | id, user_id, topic_id, status, turn_count, rolling_summary_enc, summary_enc, question_enc, model, prompt_version, tokens_in, tokens_out, started_at, finished_at, resume_until | S3 |
| `soul_messages` | id, session_id, role (`user/guide/system_fixed`), body_enc, idempotency_key, created_at, purge_at | S3, purge job |
| `soul_insights` | id, user_id, session_id, category, text_enc, evidence_enc, trait_key, trait_value, status, visibility, user_edited, created_at, updated_at | S3 |
| `user_data_keys` | user_id PK, wrapped_key, key_version, created_at | delete = crypto‑shred |
| `safety_events` | id, user_id, category, created_at | no content |
| `blocks` | blocker_id, blocked_id, created_at | PK pair |
| `reports_moderation` | id, reporter_id, reported_id, match_id?, message_id?, category, comment, urgent, status, assigned_to, resolution, created_at, resolved_at | (named to avoid clashing with `reports`) |
| `moderation_actions` | id, admin_id, target_user_id, action, reason, report_id?, created_at | append‑only |
| `admin_users` | id, email, password_hash (Argon2id), role, mfa_secret_enc, active | separate from users |
| `audit_events` | id, actor_type, actor_id, action, target_type, target_id, metadata (no PII), created_at | append‑only |
| `data_export_jobs`, `deletion_jobs` | id, user_id, status, timestamps, error | idempotent |
| `notifications` | id, user_id, type, payload (jsonb, no private content), read_at, created_at | in‑app notification centre, purge after 90 days |
| `invites` (ALPHA) | id, code (unique, 8 chars, unambiguous alphabet), created_by (admin or user), max_uses, uses, expires_at, created_at | — |
| `invite_redemptions` (ALPHA) | invite_id, user_id, redeemed_at | — |
| `feedback` (ALPHA) | id, user_id, category, text, screenshot_key?, app_version, platform, screen, created_at, status (`new/triaged/done`) | screenshots in a private bucket prefix, 90‑day retention |

Additional columns: `users.role` (`user` / `tester`), `users.is_demo` (bool, demo profiles, alpha only), `users.invites_left` (default 3 in alpha). Production migrations must assert that no `is_demo=true` rows exist.

**Data classes** (`docs/privacy-retention.md` per field): **S0** public profile · **S1** account/private settings · **S2** sensitive (answers, Soul Profile, location, chats, reports) · **S3** intimate (Soul Talk). Encryption at rest via managed Postgres for all, plus app‑level encryption for S3. Daily backups, 7‑day retention, tested restore (`docs/runbooks/restore.md`).

