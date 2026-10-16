> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 0. Read this first (instructions for the coding agent)

## 0.1 How to work
1. **Read all PRD parts before writing code** (start with [README](README.md)). Use requirement IDs (e.g. `ENG-004`) in commits, tests and `docs/implementation-status.md`.
2. **The Soul Engine ([08](08-soul-engine.md)) is the heart.** It must be a pure, deterministic, versioned TypeScript package with no framework or I/O dependencies (`apps/api/src/engine/`), ≥ 95% line coverage and property‑based tests.
3. **First target = Alpha (friends test)** ([18](18-release-plan.md)). Build the milestones in the order given there. Don't build P1/P2 items before the Alpha gate ([19](19-acceptance-checklists.md)) passes.
4. **One codebase, three platform families.** Flutter app for Web, Android, iOS, Windows, macOS and Linux ([02 §2.2](02-decisions-and-platforms.md)). Every feature must work on the web build first, because that is how friends will test.
5. **Build in small vertical slices.** One slice = migration + API + screen (all breakpoints) + tests, working end‑to‑end. Never generate the whole app in one pass.
6. **Use the defaults in [02](02-decisions-and-platforms.md).** Items marked `CONFIRM` are founder decisions: implement the default behind config and don't stop to ask.
7. **Stop and ask only when** the PRD contradicts itself, a requirement is impossible as written, or you need a real secret/account (e.g. an Apple developer account, API keys). Never invent credentials, never commit secrets.
8. **No fake completeness.** Production paths never call mocks. Dev/test fakes only behind `APP_ENV=development|test`. Alpha test tools only behind `APP_ENV=alpha` ([18 §18.3](18-release-plan.md)). Never mark untested work as done.
9. **After every slice:** format → lint → typecheck → tests → build (API + Flutter web at minimum). Update `docs/implementation-status.md`: requirement IDs, status, exact commands run and their results, known gaps.
10. **Don't rewrite the PRD.** Propose changes in `docs/prd-change-requests.md`.

## 0.2 Priority labels
- **ALPHA**: needed for the friends test. Build first.
- **P0**: needed for the closed beta (everything ALPHA + the rest of the MVP).
- **P1**: needed for public launch.
- **P2**: later, separate decision.
- **NEVER**: don't build, even partially.

Every ALPHA item is also P0. [06-scope](06-scope.md) lists which P0 items are ALPHA.

## 0.3 Status values
`NOT STARTED → IN PROGRESS → IMPLEMENTED → TESTED → ACCEPTED` (only the founder sets ACCEPTED).

## 0.4 Definition of Done (every requirement)
- The acceptance criteria (AC) pass.
- Automated tests exist and pass. Auth, permission and privacy rules **always** have integration tests. Engine functions **always** have unit tests.
- Lint, typecheck and build pass in CI for the API and the Flutter web build. Android build passes. Other platforms per [17](17-testing.md).
- The screen works at all three breakpoints (mobile, tablet, desktop: [05 §5.9](05-ux-and-design.md)) and has loading / empty / error / offline / permission‑denied states where relevant.
- No secrets, tokens, exact coordinates, questionnaire answers, Soul Talk content or message bodies in logs or analytics.
- Docs updated (OpenAPI, status file, ADR if a decision was made).

## 0.5 Documents the agent creates and maintains
```
docs/prd/                       ← this PRD (read-only for the agent)
docs/implementation-status.md   ← per-requirement status table
docs/prd-change-requests.md
docs/decisions/NNNN-title.md    ← ADRs
docs/api/openapi.yaml           ← API source of truth
docs/engine/                    ← item sources, band texts, codes catalog, quality reports, changelog per ENGINE_VERSION
docs/threat-model.md
docs/privacy-retention.md
docs/analytics-events.md
docs/test-plan.md
docs/runbooks/                  ← restore, incident, account takeover, harassment escalation, alpha data reset
docs/alpha-testers-guide.md     ← one page for friends: how to install/open, what to test, how to send feedback
README.md                       ← run everything locally in < 10 minutes
.env.example                    ← variable NAMES only
```
