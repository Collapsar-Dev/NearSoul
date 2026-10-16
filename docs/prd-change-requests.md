# PRD change requests

Deviations made during implementation, with reasons. The founder accepts or rejects each.

| # | PRD | Change | Why | Status |
|---|---|---|---|---|
| CR-1 | D3 PostGIS | Geo matching uses **H3 cells (h3-js) + haversine in code**; PostGIS not required | Alpha scale is small; removes an extension dependency; the privacy model (latest snapped cell only) is unchanged | Proposed |
| CR-2 | D4 Redis/BullMQ | **In-process scheduler (@nestjs/schedule) + in-memory rate limiter**; durable limits (login codes) enforced in Postgres | One always-on instance in alpha; fewer moving parts and costs. Redis returns when scaling out | Proposed |
| CR-3 | PROF-002 signed PUT upload | **Direct multipart upload to the API**, validated and re-encoded server-side | Simpler on web and mobile; same security properties (magic bytes, re-encode, metadata stripped, private storage) | Proposed |
| CR-4 | D33 React admin | **Static HTML/JS admin client** served by the API at `/admin` | No extra build pipeline for alpha; all data still goes through `/admin/v1` with MFA | Proposed |
| CR-5 | D12 AI models | Card/report writer uses **`claude-opus-5-5` at low effort** with server-side refusal fallback (configurable via `AI_MODEL_WRITER`) | Follows current Anthropic guidance for model choice; cost is small (short outputs) and capped by `AI_DAILY_BUDGET_USD` | Proposed |
| CR-6 | D1 freezed/json_serializable | **Hand-written light models / JSON maps** in Flutter | Avoids a build_runner step for the alpha | Proposed |
| CR-7 | §14.3 report writer | Alpha reports use **deterministic localized templates** from engine codes (no AI prose yet) | Zero AI cost and fully predictable for the friends test; the AI writer can be layered on later | Proposed |
| CR-8 | Mini-IPIP ru | IPIP items are shown **in English with a note** in the Russian UI | No approved Russian translation yet (founder decision in §20) | Needs decision |
