# ADR 0002: Psychometric instruments

**Status:** accepted · **Date:** 2026-10-16

- **Quick Scan, Block A:** Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006), 20 items from the International Personality Item Pool (IPIP). IPIP items are in the **public domain** (ipip.ori.org). Item texts in `apps/api/src/engine/items.ts` must be checked against the official IPIP source before production; the About screen credits IPIP.
- **Deep Personality (later milestone):** IPIP-NEO-120 (Johnson, 2014), also public domain.
- **Custom NearSoul items** (relationship, values, lifestyle, communication) are original wording owned by NearSoul.
- **Not used:** MBTI (low validity, trademark), any clinical instrument.
- **Russian:** no approved translation of IPIP items yet → shown in English with a note (CR-8). Options: a published Russian IPIP translation, or professional translation + back-translation.
- **Scoring:** reverse keys, mean → 0–100, theoretical bands (35/65) until ≥1,000 profiles per locale allow empirical percentiles.
