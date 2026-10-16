> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 15. Admin panel (P0 minimal)

- Separate `admin_users`: email + password (Argon2id) **+ TOTP MFA**. 8 h sessions. Optional IP allowlist.
- Roles: **moderator** (queue, hide/restore, remove photo, warn), **support** (lookup by id/email, deletion/export status, subscription status read‑only), **admin** (everything + suspend/ban + manage admins + view engine config versions).
- Queue: urgent first, then oldest. Case view: reported profile (public data), report, and **only for chat‑linked reports** the last 50 messages of that conversation (access logged with reason).
- **Never accessible to any admin role:** Soul Talk data, raw engine answers, Soul Profile scores, reports content. Aggregate counts only (sessions, safety events by category, archetype distribution).
- Actions → `moderation_actions` + `audit_events`. Ban = `suspended`, sessions revoked, hidden, photo hashes denylisted.
- Engine config: admins can view config versions and the A/B bucket split. Changing `match_config` is done by a reviewed migration/seed PR, not in the UI (MVP).
- **ALPHA tools in admin:** create invite codes (single or batch, max uses, expiry), see redemptions, grant `tester` role, read and triage feedback (screenshots via signed URLs), see alpha metrics (sign‑ups, Quick Scan completion, matches, messages, feedback count).
- **AC:** moderator can't ban (test). Every action audited (test). No admin route returns S3 or raw S2 engine data (route inventory test).

