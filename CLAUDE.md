# NearSoul: agent guide

The product spec is **docs/prd/** (v3.1, split into numbered parts). Start with `docs/prd/README.md` and read every part before changing code. It is the source of truth.

## Rules
- Follow `docs/prd/00-read-first.md` (workflow, Definition of Done) and the decisions in `02-decisions-and-platforms.md`. Use the defaults there. `CONFIRM` items are configurable, so don't block on them.
- **The Soul Engine (`08-soul-engine.md`) is the heart of the product.** Keep it a pure, deterministic, versioned TypeScript package in `apps/api/src/engine/` with no I/O, ≥ 95% test coverage and property tests for symmetry and bounds. AI only writes prose around engine outputs. It never changes scores, filters or access.
- **First target: the Alpha friends test** (`18-release-plan.md`). One Flutter codebase for Web, Android, iOS and desktop. Every feature must work on the web build first, at all three breakpoints.
- Build one vertical slice at a time in the milestone order of `18-release-plan.md`. Reference requirement IDs (e.g. `ENG-012`) in commits and tests.
- After each slice: format, lint, typecheck, test, build. Then update `docs/implementation-status.md` with the commands you ran and their results.
- Never expose exact location, engine answers, raw scores, Soul Talk content or message bodies (APIs, logs, analytics). Never commit secrets.
- Paid content is enforced server‑side only (never send locked data to the client). Chat and safety are never paywalled.
- Soul Talk data (`10-features.md` §10.7) is owner‑only and encrypted: no admin access, no logging. Crisis handling (SOUL‑006) is release‑blocking.
- Alpha‑only features (demo profiles, location simulator, tester tools) must be impossible in production (runtime + compile‑time guards).
- Don't rewrite the PRD. Propose changes in `docs/prd-change-requests.md`.

## First task (when the repo is empty)
Do not write application code yet. Return:
1. a short assessment of the repo,
2. ADR drafts for: hosting, auth, geo (H3 + PostGIS), storage, AI provider + data terms, analytics, psychometric instruments (IPIP sources, licences, Russian translation), payments (RevenueCat), using the PRD defaults,
3. a task breakdown for milestones M0, M1 and M2 (small, independently testable tasks), plus the list of accounts/secrets the founder must provide for the Alpha (`18-release-plan.md` §18.4),
4. the top security, privacy and psychometric‑quality risks you see.

Then wait for approval before implementing M0.
