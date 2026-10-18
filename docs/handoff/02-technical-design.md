# NearSoul — Technical Design

Версия 2026-10-18. Описывает архитектуру «как построено». Точные контракты в [03-technical-specification.md](03-technical-specification.md).

---

## 1. Общая схема

```
┌───────────────────────────── Клиенты ─────────────────────────────┐
│  Flutter app (apps/app): Web/PWA · Android · iOS · Win · Mac · Linux│
│  Riverpod · go_router (path URLs) · Dio · socket.io · flutter_map   │
└───────────────┬───────────────────────────────┬────────────────────┘
                │ HTTPS REST /v1/*               │ WebSocket (socket.io)
                ▼                                ▼
┌──────────────────── API: NestJS модульный монолит (apps/api) ──────┐
│ auth · me · personas · profile · engine · discovery · matches      │
│ nearby (+map, tiles) · notifications · reports · soul · safety     │
│ billing · ads · alpha · admin · export · analytics · jobs · storage│
│                                                                    │
│   ┌──────────── Soul Engine (src/engine) ────────────┐              │
│   │ чистый TS, без I/O, детерминированный,           │              │
│   │ версия ENGINE_VERSION 2.2.0                      │              │
│   └──────────────────────────────────────────────────┘              │
│ In-process планировщик (@nestjs/schedule) · in-memory rate limiter  │
└──────┬──────────────┬───────────────┬───────────────┬──────────────┘
       ▼              ▼               ▼               ▼
  PostgreSQL 17   Хранилище фото   Anthropic API   Push: Web Push (VAPID)
  (Prisma 6)      db | local | S3  (выкл. в альфе)  / FCM (нужен Firebase)
                                    Email: screen | console | brevo | resend
                                    Карты: OSM через /v1/tiles (кэш)
```

**Альфа-развёртывание:** один Render web service (Frankfurt) отдаёт и API, и собранный веб-клиент с одного домена (`deploy/web`), плюс бесплатный Render Postgres. Админ-панель — статический HTML/JS на `/admin`.

## 2. Ключевые решения (ADR) и почему

| Решение | Выбор | Почему | Документ |
|---|---|---|---|
| Клиент | Flutter, одна кодовая база | Одна команда, все платформы, веб первым | PRD D1 |
| Бэкенд | NestJS модульный монолит, TypeScript | Простота, один деплой, общий язык с движком | ADR-0001 |
| БД | PostgreSQL 17 + Prisma, **без PostGIS** | H3 + haversine в коде достаточно на этом масштабе | CR-1 |
| Очереди | **Без Redis**: in-process интервалы | Один инстанс в альфе, меньше сервисов и затрат | CR-2 |
| Гео | H3 res 9 (~175 м), только последняя ячейка, TTL 24 ч | Приватность: нет истории, нет точки | ADR-0001, D29 |
| Карта | H3 res 8 (~460 м) для матчей, тайлы OSM через свой прокси | Район, а не дом; IP пользователей не уходят третьим лицам | CR-29 |
| Хранилище фото | Драйвер `db` (Postgres) в альфе, `s3` (R2) в prod | На бесплатном Render нет диска | render.yaml |
| Загрузка фото | Multipart прямо в API, перекодирование sharp | Проще на вебе, те же гарантии безопасности | CR-3 |
| Auth | Код на email, JWT 15 мин + refresh 30 дней с ротацией | Без паролей; кража refresh обнаруживается | PRD D5/D6 |
| ИИ | Anthropic за интерфейсом `AiProvider`, шаблоны как запасной вариант | Детерминизм и нулевая стоимость в альфе | CR-5, CR-7 |
| Опросники | IPIP (public domain): Mini-IPIP, IPIP-NEO-120 | Научная база, без лицензионных платежей | ADR-0002 |
| Модели во Flutter | Ручные JSON-модели, без build_runner | Быстрее сборка альфы | CR-6 |

## 3. Структура репозитория

```
apps/api/
  prisma/schema.prisma, migrations/, seed.ts, seed-demo.ts
  src/main.ts, bootstrap.ts (helmet/CSP, CORS, cookies, no-store, статика веба)
  src/config/env.ts         ← валидация всех переменных (zod) + защиты окружений
  src/common/               ← auth guard, ошибки, логирование с редактированием, rate limit, family (персоны), crypto
  src/engine/               ← Soul Engine (чистый)
  src/content/              ← тексты (en/ru), справочники
  src/modules/<домен>/      ← controller + service на домен
  public/admin/             ← статическая админ-панель
  test/                     ← e2e на реальном Postgres (26 файлов)
apps/app/
  lib/core/                 ← api (Dio), session, router, theme, realtime, push, responsive, platform/*
  lib/features/             ← auth, onboarding, today, nearby, soul, matches, me
  lib/l10n/                 ← app_en.arb, app_ru.arb (+ gen/)
  web/                      ← index.html, manifest, push.js, push-sw.js, image.js, mobile.html
deploy/web/                 ← собранный веб (коммитится, чтобы Render не собирал Flutter)
scripts/                    ← dev-db.mjs (локальный Postgres без Docker), build-web-dist.sh, serve-web.mjs
docs/                       ← prd/, prd-change-requests.md, implementation-status.md, decisions/, engine/, handoff/
render.yaml                 ← Blueprint альфы
.github/workflows/ci.yml    ← API + Flutter (web, APK) + десктоп
```

## 4. Модули API и их ответственность

| Модуль | Отвечает за | Ключевые сущности |
|---|---|---|
| auth | коды входа, сессии, ротация refresh, переключение персоны | AuthCode, Session |
| me / personas | аккаунт, DOB, согласия, онбординг, удаление, до 3 профилей | User, Consent |
| profile | анкета, фото (загрузка, порядок, удаление) | Profile, Photo, Media |
| engine | вопросы, ответы, пересчёт профиля, архетип | EngineAnswer, SoulProfileRow, LayerOverride, MatchConfigRow |
| ai (card) | карточка личности (шаблон / ИИ) | PersonalityCard |
| discovery | «Души дня» (генерация, пагинация, догрузка), просмотр профиля | DailySet |
| matches | лайки, матчи, чат, запросы «написать первым», «тебя лайкнули», rewind | Like, Match, Message, MessageRequest |
| nearby | локация, Open to meet, сопоставление, алерты, **карта матчей**, **прокси тайлов** | UserLocation, NearbySession, NearbyAlert, NearbyLater, MapShare |
| notifications | центр уведомлений, Web Push, FCM, правила тихих часов | Notification, DeviceToken |
| reports | отчёт «о себе» и «вы двое» | — (вычисляется) |
| soul | Soul Talk: сессии, сообщения (шифрование), инсайты, Soul Map | SoulSession, SoulMessage, SoulInsight, UserDataKey, SafetyEvent |
| safety | блоки, жалобы | Block, Report, ModerationReport |
| billing | уровни, функции уровней, тестовая активация, вебхук RevenueCat | Entitlement, BillingEvent |
| ads | рекламные карточки, счётчики показов/кликов | AdCard |
| alpha | симулятор локации, сброс набора, отладка движка (только alpha/dev/test) | — |
| admin | вход + TOTP, очередь модерации, пользователи, инвайты, отзывы, метрики, аудит | AdminUser, ModerationAction, AuditEvent |
| export | экспорт данных пользователя (zip) | DataExportJob |
| analytics | серверная аналитика с согласием (PostHog) | — |
| jobs | ретеншн, очистка, TTL | — |
| storage | драйверы db/local/s3, подписанные URL (10 мин) | Media |

## 5. Soul Engine: устройство

- Папка `apps/api/src/engine/`, экспорт через `index.ts`: `types`, `items` (Quick Scan), `deep-items` (IPIP-NEO), `scoring`, `archetype`, `match-config`, `eligibility`, `compatibility`, `explain`, `ranking`.
- ESLint запрещает внутри движка импорты фреймворков, `Date.now()` и `Math.random()`. Время передаётся параметром.
- Веса и таблицы в `match_config` (версионированный JSON в БД), в коде только формулы.
- Пересчёт профиля при каждом ответе и при смене `ENGINE_VERSION` (фоновой задачей).
- Тесты: юнит, property-based (симметрия, границы 0–100, детерминизм), golden-снимки 20 пар персон.

Поток подбора:
```
ответы → scoreProfile() → SoulProfile (домены, слои, confidence, archetype)
                     ↓
кандидаты из БД → eligibility(A,B) [пол, возраст, цель, блоки, прошлые матчи, пропуски, дилбрейкеры]
                     ↓
compatibility(A,B,config) → {score, tier, layerScores, reasons, frictions, tips}
                     ↓
rankDailySet() → score × свежесть × бонус новичку, демо после реальных, ≤ 3 одинаковых архетипа подряд
                     ↓
daily_sets (стабилен в течение дня) → API отдаёт страницами по 30
```

## 6. Ключевые потоки

### 6.1 Вход
1. `POST /v1/auth/code {email}` → хеш кода в `auth_codes`. В альфе с `EMAIL_PROVIDER=screen` в ответе `testCode`.
2. `POST /v1/auth/verify {email, code}` → создаёт пользователя при первом входе, сессию, access JWT (15 мин) и refresh (30 дней). Веб: refresh в httpOnly cookie, access в памяти. Native: secure storage.
3. `POST /v1/auth/refresh` ротирует refresh; повторное использование старого отзывает всё семейство сессий.

### 6.2 Матч и чат
Лайк → проверка, что цель была доступна (дневной набор за 3 дня, или алерт рядом, или «тебя лайкнули» для Gold+) → проверка лимита → если встречный лайк есть, в одной транзакции создаётся `Match` (уникальная пара) → уведомления обоим + событие `match.new` по сокету. Сообщения: REST POST + realtime-событие, `read` отметки.

### 6.3 «Души дня» с пагинацией
`GET /v1/daily-set?offset&limit` → сервис берёт/генерирует набор на локальную дату. Набор дополняется, если уровень вырос или прошло > 2 мин и людей меньше лимита. Клиент грузит по 30, вставляет рекламу каждые 10 и перерыв «Узнай себя» каждые 50.

### 6.4 Карта матчей
Клиент на экране карты отправляет `POST /v1/location` (раз в 5 мин, пока экран открыт) → сервер хранит только центр H3 res 9 → `GET /v1/map` отдаёт активным матчам, у которых включён `map_shares`, центр H3 res 8 и расстояние, округлённое до 100 м. Блок, конец матча, истечение срока или выключение — сразу пропадает.

### 6.5 Soul Talk (выключен)
Сообщение → классификатор безопасности (ИИ + ключевые слова ru/en) → при риске фиксированный кризисный ответ + ресурсы → иначе ответ гида. Всё шифруется ключом пользователя (`UserDataKey`, обёрнут `SOUL_MASTER_KEY`); удаление ключа = криптоудаление.

## 7. Клиент (Flutter)

- Навигация: `StatefulShellRoute` с 5 вкладками — Сегодня, Рядом, Душа, Матчи, Я. Пути URL: `/today`, `/nearby`, `/nearby/map`, `/soul`, `/matches/:id`, `/me/...`.
- Адаптивность (`core/responsive.dart`): compact < 600 (нижняя панель), medium 600–1023 (узкий rail), expanded ≥ 1024 (боковое меню с названиями). Лента: 1/2/3 колонки.
- Состояние: Riverpod (`sessionProvider`, `apiProvider`, `realtimeProvider`, `appearanceProvider`).
- Платформенный код за интерфейсами в `core/platform/*` (web/stub): HTTP-адаптер, иконка вкладки, конвертация изображений, Web Push.
- Семантика доступности принудительно включена только на десктоп-вебе (на телефоне она ломала клавиатуру).
- Локализация: ARB en/ru, генерация `flutter gen-l10n`.

## 8. Безопасность и приватность (как реализовано)

| Угроза | Защита |
|---|---|
| Перебор кодов | 5 попыток на код, лимиты на email и IP, хранится только хеш |
| Кража сессии | Короткий access, ротация refresh, обнаружение повторного использования, httpOnly SameSite=Strict cookie |
| IDOR | Каждый маршрут проверяет владельца; e2e-тесты на чужие id |
| Трилатерация | Только диапазоны; на карте только для матчей по желанию, центр res 8, округление 100 м |
| Утечка в логах | pino с редактированием; нет координат, ответов, тел сообщений, Soul Talk |
| Кэш личных данных | `Cache-Control: no-store` на `/v1` кроме `/v1/media` (подписанные) и `/v1/tiles` (публичные) |
| Фото | Проверка magic bytes, перекодирование, удаление EXIF/GPS, приватное хранилище, подписанные URL 10 мин |
| XSS/кликджекинг | helmet + CSP (connect-src self/https/wss, frame-ancestors self) |
| SSRF через push | Allowlist хостов push-сервисов |
| Альфа в prod | `env.ts` отклоняет `EMAIL_PROVIDER=screen/console`, тестовую активацию, демо и инструменты тестера вне alpha/dev/test |

## 9. Наблюдаемость
- Логи pino (JSON) с request id; ошибки в формате `{error: {code, message, request_id, details}}`.
- `/health` (жив), `/ready` (БД доступна) — используется Render.
- Аудит админ-действий в `audit_events`.
- Аналитика: серверная, только с согласием, без PII (PostHog, нужен ключ). Sentry предусмотрен PRD, ещё не подключён.

## 10. Масштабирование (когда понадобится)
1. Redis + BullMQ вместо in-process интервалов и in-memory лимитов → несколько инстансов API.
2. Socket.IO Redis adapter для реалтайма между инстансами.
3. Фото в R2/S3 + CDN.
4. PostGIS, если кандидатов в городе станет > ~50 тыс.
5. Платный провайдер тайлов (или свои тайлы) вместо OSM.
