> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 16. Non‑functional requirements

## 16.1 Security (P0): OWASP MASVS (mobile) + OWASP API Security Top 10
TLS everywhere, HSTS on admin. Secrets in the hosting secret store, `.env.example` names only, Gitleaks in CI. Dependency scanning, lockfiles. Object‑level authorization everywhere (§13 matrix). Separate dev/staging/prod (DBs, buckets, keys, Firebase and RevenueCat projects). Log redaction (auth headers, tokens, codes, masked emails, coordinates, answers, scores, message and Soul text). RevenueCat webhook signature verification. Runbooks: account takeover, data leak, harassment escalation, AI provider outage.

## 16.2 Privacy (P0)
Data minimization (location = latest cell only, ≤ 24 h, no history anywhere). Retention per field in `docs/privacy-retention.md`. GDPR rights: access/export, deletion, rectification (edit traits, retake), withdraw consent. Engine answers and profiles are S2: never exposed raw, never in analytics, sent to AI only as bands/codes and only with consent. Pair reports respect share levels and reciprocity. Soul Talk is S3 (SOUL‑007). `docs/threat-model.md` covers: location inference, scraping profiles by id, report data leaking across share levels, DB leak, insider access, AI provider retention, log leakage, device loss, payment fraud. Legal review of Terms/Privacy for the launch jurisdiction **before public launch** (`CONFIRM`).

## 16.3 Performance & reliability (beta targets, measure before claiming)
API p95 < 300 ms (non‑AI), daily set fetch p95 < 500 ms (pre‑generated), profile computation < 200 ms, pair compatibility < 5 ms per pair (pure function), daily set generation for 10,000 users < 10 min, nearby matcher cycle < 30 s for 10,000 open users, chat delivery < 1 s p95, cold start < 2.5 s on a mid‑range Android, crash‑free ≥ 99.5%. Health checks, graceful shutdown, idempotent jobs, retries with backoff, daily backups + restore drill before beta.

## 16.4 Accessibility (P0)
Screen reader labels, dynamic type up to 200%, WCAG AA contrast, ≥ 44 pt targets, reduced motion (reveal animation has a static alternative). Test Quick Scan, reveal, Today, Nearby, chat, report, paywall with TalkBack and VoiceOver.

## 16.5 Observability
Structured JSON logs with request_id. Metrics: route latency/errors, job queues, daily set generation time, nearby matcher duration, alerts sent, engine recompute counts, AI latency/cost/fallback rate per feature, paywall/purchase funnel, webhook failures, report backlog age. Alerts: error rate > 2%, urgent report > 1 h, AI budget 80%, webhook failures > 5 in 10 min.

