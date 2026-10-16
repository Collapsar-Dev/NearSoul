# ADR 0001: Alpha architecture

**Status:** accepted for the alpha · **Date:** 2026-10-16

## Context
The first goal is a friends test (PRD 18) that runs on web, Android and optionally iOS/desktop, built and operated by a solo founder.

## Decision
- **API:** one NestJS modular monolith (TypeScript), Prisma on PostgreSQL 17, deployed as a single always-on Render web service in Frankfurt (EU).
- **Soul Engine:** a pure, deterministic TypeScript package (`apps/api/src/engine`) with no I/O; ESLint forbids framework imports, `Date.now()` and `Math.random()` inside it.
- **Client:** one Flutter codebase for web/Android/iOS/desktop; web is the primary alpha surface (PWA).
- **Auth:** passwordless email codes; access JWT 15 min; rotating opaque refresh tokens (hashed); web keeps the refresh token in an httpOnly SameSite=Strict cookie.
- **Geo:** H3 resolution 9 cells; only the latest cell centre is stored, max 24 h; distances shown as bands only (CR-1).
- **Jobs:** in-process intervals (nearby matcher, alert delivery, expiry, retention) (CR-2).
- **Storage:** private S3-compatible bucket (Cloudflare R2) with 10-minute signed URLs; local filesystem driver only in development/test.
- **AI:** Anthropic Claude through an internal `AiProvider`; structured output validated with zod; template fallback; daily budget cap.

## Consequences
Single instance limits horizontal scaling (fine for alpha). Moving to Redis/BullMQ and multiple instances is a contained change in the scheduler and rate limiter.
