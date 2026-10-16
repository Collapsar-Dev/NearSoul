> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 19. Acceptance checklists

## 19.1 Alpha gate (friends test)
- [ ] Alpha web app live on HTTPS at the alpha domain. Installable as a PWA (desktop Chrome/Edge, Android Chrome, iOS Safari).
- [ ] Android APK downloadable from `/download` and installs on a real device.
- [ ] Invite‑only sign‑up with email code works on web and Android. Alpha terms consent shown.
- [ ] Age gate enforced server‑side.
- [ ] Quick Scan → Soul Profile reveal ≤ 2 s → archetype → DNA card (AI or template) on compact, medium and expanded layouts.
- [ ] Engine package: deterministic, ≥ 95% coverage, symmetric bounded compatibility, golden persona pairs approved.
- [ ] Band texts reviewed by the founder, banned‑words lint passes.
- [ ] Profile + photo upload (web file picker/drag & drop, Android camera/gallery). EXIF stripped. Public DTO allowlist test passes.
- [ ] Today's Souls never empty (demo profiles with DEMO badges and illustrated avatars).
- [ ] Like → mutual match → realtime chat between a web user and an Android user. Starters work, never auto‑sent.
- [ ] Self report and "You two" report free and complete. Share‑level reciprocity enforced.
- [ ] Nearby: real alert between two phones. Simulator works for testers only and is absent outside alpha.
- [ ] Block, report → admin queue → action, audited. Admin MFA on.
- [ ] In‑app notification centre. Android push for match and message.
- [ ] Feedback button + reveal accuracy rating stored and visible in admin.
- [ ] Account deletion works (immediate sign‑out and invisibility).
- [ ] Sentry receiving crashes from web and Android. Analytics only with consent, no PII.
- [ ] No sensitive data in logs (automated scan). Web tokens not in localStorage (test).
- [ ] Testers guide (en + ru) and download page published.

## 19.2 Closed beta gate (MVP)
- [ ] Email code auth, logout/logout‑all, refresh rotation with reuse detection, no account enumeration, rate limits.
- [ ] Age gate and Terms consent enforced server‑side on all dating, engine‑report and nearby routes.
- [ ] **Engine:** Quick Scan → Soul Profile ≤ 2 s. Deterministic, versioned, ≥ 95% coverage. Symmetric bounded compatibility. Unknowns excluded. All eligibility filters tested. Golden persona pairs approved.
- [ ] Reveal screen with archetype, positive band texts (banned‑words lint passes), confidence hints.
- [ ] DNA card: schema‑validated, template fallback, review/edit/hide, AI label.
- [ ] Deep Personality 4 parts with recompute.
- [ ] Today's Souls: stable daily set, fallbacks, honest empty state, no payment influence.
- [ ] Reports: self summary/full, pair teaser/full, share levels + reciprocity, pair reports deleted on unmatch/block.
- [ ] Billing: RevenueCat sandbox purchase + restore on iOS and Android, server entitlements, no locked content sent without entitlement, `PAYWALL_ENABLED` both states tested.
- [ ] Profile public DTO allowlist. Photos re‑encoded, EXIF stripped.
- [ ] Discovery off by default. Location latest‑cell only ≤ 24 h. Bands only (contract + trilateration tests). Open window server‑enforced. Nearby alerts follow GEO‑006.
- [ ] Mutual match only (race test). Chat authorization on every request/event. Starters never auto‑sent.
- [ ] Block/unmatch stop contact immediately. Report → queue → audited action. Admin MFA. No admin access to S3/raw engine data.
- [ ] Soul Talk: consent, resume, insights require Keep, crisis eval 100%, crisis resources approved, encryption, owner‑only, purge, crypto‑shred.
- [ ] Push without private content by default. Max 1 non‑conversation push/day.
- [ ] Deletion (immediate invisibility + session revoke + key shred) and export work.
- [ ] No sensitive data in logs/analytics (automated scan).
- [ ] Staging/prod separated, backups + tested restore, runbooks exist.
- [ ] Real iOS + Android device tests. Crash‑free ≥ 99.5% internally.

