> NearSoul PRD v3.1 · part of [the PRD index](README.md)

# 1. Product summary

## 1.1 One sentence
**NearSoul figures out who you are with a real psychological engine, then shows you people with a compatible character and values, including those who are near you right now, and explains why you might click.**

Tagline: *"Get to know yourself. Discover someone compatible."*

## 1.2 The problem
- Swipe apps judge by photos. Hundreds of swipes, shallow chats, dates that happen 10 days later with someone who lives far away.
- Users have nothing meaningful to start a conversation with and no idea whether they actually fit.
- Personality "tests" in dating apps are usually gimmicks without a scientific base.
- Proximity apps often leak location (exact distance → trilateration) or show everyone to everyone, which feels unsafe.

## 1.3 The solution
```
         ┌──────────────────────────────────────────────┐
         │                SOUL ENGINE (heart)            │
         │  Who you are  →  Who fits you  →  Why         │
         │  (psychometric   (compatibility   (reasons,   │
         │   profile)        model)           reports)   │
         └───────▲───────────────┬────────────────┬──────┘
                 │               │                │
     Questionnaires +       Today's Souls     Nearby Now
     Soul Talk (AI          (daily curated    (compatible people
     self-discovery)         matches)          near you right now)
                                 │                │
                                 └──► Mutual like ─► Chat + "You two" report
                                                       (teaser free, full = Soul+)
```

| Pillar | What the user gets |
|---|---|
| **Soul Engine** (heart) | A psychometric profile built on the scientifically established **Big Five** model, plus layers for relationship dynamics, values, lifestyle and communication. Results: a friendly **Soul Archetype**, a **Soul Profile** with explanations, and a compatibility model that ranks people for you. |
| **Soul Talk** | Short AI‑guided self‑reflection conversations that deepen the profile over time. Private, encrypted, owner‑only. |
| **Today's Souls** | A small daily set (default 15) of the most compatible people in your city, with reasons. No endless swiping. |
| **Nearby Now** | Turn on *Open to meet* for 1–4 h. When a compatible person who is also open is nearby, you both get one private alert. Distance shown only as a range. |
| **Reports + Soul+** | Free: your archetype, basic profile, and a short teaser about you and each match. **Soul+ subscription**: full self report, deep "You two" compatibility reports for your matches, unlimited Soul Talk. |

## 1.4 Product principles (apply to every decision)
1. **Understanding first.** Every screen should help people understand themselves or each other a bit better.
2. **Science‑based, honestly framed.** Use validated psychometrics where they exist. Never claim the engine predicts love. Say "helps you understand", never "finds your soulmate".
3. **Consent and reciprocity.** You see as deep about others as you allow others to see about you (§9.3). Nothing about you is shown or sold without your explicit choice.
4. **Privacy by design.** Never expose exact location. Store as little as possible, as briefly as possible. Soul Talk is owner‑only and encrypted.
5. **Safety is core.** 18+, block, report, moderation and crisis handling are P0.
6. **Honest AI.** AI writes and suggests text. Deterministic code decides scores, access and eligibility. AI never impersonates the user or sends messages.
7. **No dark patterns.** No fake notifications, no countdown paywalls, no guilt streaks, cancel and delete are always easy. Chat and safety are never behind a paywall.
8. **Density before breadth.** Launch city by city.
9. **Simple architecture.** One modular monolith.

## 1.5 What we never promise
Guaranteed love, scientific prediction of relationship success, "AI finds your soulmate", clinical or diagnostic assessment, therapy, perfect protection from scammers.

