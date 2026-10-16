# NearSoul PRD v3.1: index

**NearSoul** is a psychology‑driven dating app. Its heart, the **Soul Engine**, figures out who you are (Big Five + relationship, values, lifestyle and communication layers), finds people whose character and values fit yours, shows you the ones who are nearby right now (distance only as a range, never a location), and explains why you might click. It runs on **Web, Desktop and Mobile** from one Flutter codebase.

Tagline: *"Get to know yourself. Discover someone compatible."*

## How to read this PRD
Read the parts **in order** the first time. File numbers equal section numbers, so a reference like `§8.7` means file `08`, section 8.7. Requirement IDs (e.g. `ENG-012`) are unique across all files.

| # | Part | What it answers |
|---|---|---|
| 00 | [Read first](00-read-first.md) | How the agent must work, Definition of Done, priorities |
| 01 | [Product vision](01-product-vision.md) | What NearSoul is, the problem, the four pillars, principles |
| 02 | [Decisions & platforms](02-decisions-and-platforms.md) | Tech stack defaults, **Web / Desktop / Mobile** rules, environments |
| 03 | [Glossary](03-glossary.md) | Every product term in one place |
| 04 | [Users](04-users.md) | Personas, jobs to be done, core loops |
| 05 | [UX & design](05-ux-and-design.md) | Experience principles, emotional journey, navigation, tone, **responsive layouts**, design tokens |
| 06 | [Scope](06-scope.md) | Alpha / P0 / P1 / P2 / NEVER |
| 07 | [User flows](07-user-flows.md) | Step‑by‑step flows + **edge cases** |
| 08 | [**Soul Engine** (the heart)](08-soul-engine.md) | Questionnaires, scoring, archetypes, compatibility formulas, daily set, learning loop |
| 09 | [Reports & Soul+](09-reports-and-soul-plus.md) | Self report, "You two" pair report, share levels, subscription, payments |
| 10 | [Features](10-features.md) | Auth, onboarding, profile, likes, chat, Nearby, Soul Talk, safety, notifications, settings, analytics |
| 11 | [Screens](11-screens.md) | Every screen with elements, states and desktop layout |
| 12 | [Data model](12-data-model.md) | Tables, constraints, data classes |
| 13 | [API](13-api.md) | Endpoints, auth matrix, rate limits |
| 14 | [AI spec](14-ai-spec.md) | AI architecture, prompt contracts, evaluation |
| 15 | [Admin](15-admin.md) | Moderation, invites, feedback |
| 16 | [Security, privacy, NFR](16-security-privacy-nfr.md) | Security, privacy, performance, accessibility, observability |
| 17 | [Testing](17-testing.md) | Test levels, platform matrix, CI |
| 18 | [**Release plan**](18-release-plan.md) | Environments, **Alpha (friends test)** spec, distribution per platform, roadmap |
| 19 | [Acceptance checklists](19-acceptance-checklists.md) | Alpha gate, closed beta gate |
| 20 | [Open decisions](20-open-decisions.md) | Founder decisions (defaults used meanwhile) |
| A | [Item bank](appendix-a-item-bank.md) | All Quick Scan questions |
| B | [Archetypes](appendix-b-archetypes.md) | 12 Soul Archetypes |
| C | [Codes](appendix-c-codes.md) | Reason, friction and tip codes with texts |
| D | [Copy](appendix-d-copy.md) | Key UI texts and template fragments |

## ID prefixes
`PLAT` platforms · `AUTH` authentication · `ONB` onboarding & consent · `PROF` profile · `ENG` Soul Engine · `RPT` reports · `PAY` payments · `LIKE` likes & matches · `CHAT` chat · `GEO` discovery & Nearby · `SOUL` Soul Talk · `SAFE` safety · `NOTIF` notifications · `ACC` account & settings · `ANL` analytics · `ALPHA` friends‑test tooling · `ADM` admin.

## The first goal
Ship the **Alpha (friends test)** described in [18-release-plan](18-release-plan.md): a working web app at a shareable URL (also installable on desktop and phones as a PWA), an Android APK, and optionally iOS TestFlight and native desktop builds, so the founder can invite friends.
