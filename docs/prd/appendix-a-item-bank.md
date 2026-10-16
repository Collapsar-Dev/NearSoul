> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# Appendix A: Quick Scan item bank (v1)

## A.1 Block A: How you are (Mini‑IPIP, 20 items, Likert 1–5)
Source: Mini‑IPIP (Donnellan, Oswald, Baird & Lucas, 2006), items from the public‑domain IPIP. **The agent must verify every item text and key against the official IPIP source before seeding** and record it in `docs/engine/sources.md`. Prompt frame: "How accurately does this describe you?"

| key | Item | Domain | Keyed |
|---|---|---|---|
| mi_01 | Am the life of the party. | E | + |
| mi_02 | Sympathize with others' feelings. | A | + |
| mi_03 | Get chores done right away. | C | + |
| mi_04 | Have frequent mood swings. | N | + |
| mi_05 | Have a vivid imagination. | O | + |
| mi_06 | Don't talk a lot. | E | − |
| mi_07 | Am not interested in other people's problems. | A | − |
| mi_08 | Often forget to put things back in their proper place. | C | − |
| mi_09 | Am relaxed most of the time. | N | − |
| mi_10 | Am not interested in abstract ideas. | O | − |
| mi_11 | Talk to a lot of different people at parties. | E | + |
| mi_12 | Feel others' emotions. | A | + |
| mi_13 | Like order. | C | + |
| mi_14 | Get upset easily. | N | + |
| mi_15 | Have difficulty understanding abstract ideas. | O | − |
| mi_16 | Keep in the background. | E | − |
| mi_17 | Am not really interested in others. | A | − |
| mi_18 | Make a mess of things. | C | − |
| mi_19 | Seldom feel blue. | N | − |
| mi_20 | Do not have a good imagination. | O | − |

(O = Openness/Intellect, C = Conscientiousness, E = Extraversion, A = Agreeableness, N = Neuroticism → displayed as Emotional Stability = 100 − N.) Consistency pairs: (mi_01, mi_16), (mi_02, mi_17), (mi_13, mi_08), (mi_14, mi_09), (mi_05, mi_20).

## A.2 Block B: How you love (NearSoul custom)
| key | Item | Type | Trait |
|---|---|---|---|
| rel_01 | I feel comfortable being close to a partner and relying on each other. | likert5 | closeness_comfort |
| rel_02 | When I'm close to someone, I like frequent signs that they care. | likert5 | reassurance_need |
| rel_03 | Even in a relationship, I need plenty of time on my own. | likert5 | independence_need |
| rel_04 | When there's a disagreement, I usually… | single: talk it through right away · cool down first, then talk · let it go | conflict_style: `talk_now` · `cool_down_then_talk` · `let_it_go` |
| rel_05 | I feel most cared for when someone… (pick up to 2) | multi(2): tells me how they feel · spends real time with me · helps me out · surprises me with something small · is physically affectionate | care_language: `words` · `time` · `help` · `gifts` · `touch` |
| rel_06 | I show affection openly, with words or touch. | likert5 | affection_expression |

## A.3 Block C: What matters
| key | Item | Type | Trait |
|---|---|---|---|
| val_01 | Pick your top 3 values | multi(exactly 3): family · career · adventure · stability · growth · creativity · health · faith · freedom · community | values |
| val_02 | Kids? | single: have and want more · have, no more · want someday · don't want · open · not sure | kids_plan: `have_want_more` · `have_no_more` · `want` · `dont_want` · `open` · `not_sure` |
| val_03 | In 5 years you'd love to… | single: settle down and build a home · grow my career · explore the world · balance it all | life_direction: `settle_build` · `grow_career` · `explore_world` · `balance_all` |

## A.4 Block D: How you live
| key | Item | Type | Trait |
|---|---|---|---|
| life_01 | Your ideal weekend | single: cozy at home · outdoors and active · out with friends · culture and exploring · a mix | weekend_style: `cozy_home` · `outdoors_active` · `social_out` · `culture_explore` · `mix` |
| life_02 | I prefer plans to spontaneity → I decide on the spot (1–5) | likert5 (1 = planner, 5 = spontaneous) | spontaneity |
| life_03 | How active is your lifestyle? | single ordinal: low · moderate · high · very high | activity_level |
| life_04 | Smoking | single ordinal: never · socially · regularly | smoking |
| life_05 | Drinking | single ordinal: never · rarely · socially · often | drinking |
| com_01 | When getting to know someone, I like texting… | single ordinal: all day · a few times a day · a daily check‑in · rather meet than text | texting_rhythm |
| com_02 | Light and playful talk → deep and meaningful talk (1–5) | likert5 | conversation_depth |

## A.5 Hard no's (optional)
| key | Item | Type | Trait |
|---|---|---|---|
| deal_01 | Hard no's (up to 3) | multi(≤3): smoker · heavy drinker · wants kids · doesn't want kids · has kids | dealbreakers (hard filters both ways, ENG‑011) |

## A.6 Deep Personality
IPIP‑NEO‑120 (Johnson, 2014): 120 public‑domain IPIP items, 30 facets (6 per domain). The agent imports item texts, keys and facet assignments from the official IPIP source, verifies them, and splits them into 4 parts of 30 with balanced domains per part. Facet display names and positive two‑pole descriptions are written in `docs/engine/band-texts.md` (founder review).

