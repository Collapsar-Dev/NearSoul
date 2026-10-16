# Analytics events (ANL-001)

Sent server-side by `AnalyticsService` only when the user granted the `analytics` consent and `POSTHOG_KEY` is set.
Identity: a random `analytics_id` (never the user id or email). Demo profiles are excluded.
Properties are allowlisted codes only (no free text, email, names, coordinates, answers, scores, message or Soul Talk content).
Retention: PostHog project setting, default 12 months.

| Event | Where | Properties | Purpose |
|---|---|---|---|
| account_created | first email-code verification | platform | sign-up funnel |
| age_gate_passed | DOB accepted | — | onboarding funnel |
| consent_given | consents saved | category (consent type) | consent rates |
| quick_scan_completed | last required answer | engine_version | Quick Scan completion (moment of truth 1) |
| archetype_assigned | same moment | archetype | archetype distribution |
| deep_part_completed | each Deep part | part | Deep Personality uptake |
| share_level_set | share level chosen | level | reciprocity choices |
| profile_completed | onboarding complete | — | activation |
| discovery_enabled / discovery_disabled | settings | — | visibility |
| daily_set_viewed | Today opened | count | daily loop |
| like_sent / pass_sent | like/pass | source | engagement |
| match_created | mutual like (both users) | source | matching |
| first_message_sent | first message in a match | tier | engine quality |
| conversation_reached_10_messages | both sent ≥ 10 | tier | North Star proxy |
| open_to_meet_started | Nearby opened | count (minutes) | Nearby usage |
| nearby_alert_sent | alert delivered (both) | — | Nearby density |
| self_report_viewed / pair_report_viewed | report opened | — | report value (paywall planning) |
| soul_session_started / soul_session_finished | Soul Talk | topic, turns | self loop |
| soul_insight_reviewed | keep/edit/discard | action, category, visibility | insight quality |
| block_created / report_submitted | safety actions | category | safety health |
| export_requested / account_deletion_requested | privacy actions | — | trust signals |
