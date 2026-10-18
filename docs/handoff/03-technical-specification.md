# NearSoul — Technical Specification

Версия 2026-10-18 (ENGINE_VERSION 2.2.0, 47 таблиц, 121 HTTP-маршрут, 254 автотеста API).
Это точные контракты. Если код и документ расходятся, правы код и тесты; документ надо обновить.

---

## 1. Стек и версии

| Слой | Технология |
|---|---|
| API | Node 22, NestJS 11, TypeScript strict, Prisma 6, PostgreSQL 17, zod, pino, helmet, socket.io, sharp, h3-js, argon2, otplib, web-push, @anthropic-ai/sdk, @aws-sdk/client-s3 |
| Клиент | Flutter 3.47 (Dart 3), flutter_riverpod 3, go_router 18, dio 5, socket_io_client 3, flutter_secure_storage 11, geolocator 14, image_picker, flutter_map 8 + latlong2, url_launcher, shared_preferences, flutter_timezone, intl |
| Тесты | Jest (юнит + property + golden + e2e на реальном Postgres), flutter_test |
| CI | GitHub Actions: `.github/workflows/ci.yml` |
| Хостинг альфы | Render free (Frankfurt): web service + Postgres 17 |

## 2. Окружения и защиты

| `APP_ENV` | Назначение | Разрешено только здесь |
|---|---|---|
| development | локально | `EMAIL_PROVIDER=console`, фейковый ИИ, local storage |
| test | CI | всё фейковое |
| alpha | тест с друзьями | `EMAIL_PROVIDER=screen`, демо-профили, симулятор локации, `POST /v1/billing/test-activate`, авто-ответы демо, «ТЕСТ»-бейдж |
| staging / production | бета и запуск | только реальные провайдеры; сервер **падает при старте** при запрещённой конфигурации |

Проверки при старте (`src/config/env.ts`): `screen`/`console` запрещены вне разрешённых сред; `AI_ENABLED` требует `ANTHROPIC_API_KEY`; `SOUL_TALK_ENABLED` вне dev/test требует `SOUL_MASTER_KEY` (base64, 32 байта), `CRISIS_RESOURCES` и `CRISIS_TEXTS_APPROVED=true`; в alpha без явного `DAILY_SET_SIZE` используется 200.

## 3. Переменные окружения

| Переменная | По умолчанию | Назначение |
|---|---|---|
| APP_ENV | development | среда (см. §2) |
| PORT | 3000 | порт |
| DATABASE_URL | — (обяз.) | Postgres |
| JWT_SECRET | — (обяз., ≥ 32) | подпись access JWT |
| APP_ORIGINS | http://localhost:8080 | разрешённые origin (CORS), через запятую |
| COOKIE_DOMAIN | — | домен cookie refresh |
| INVITE_ONLY | false | регистрация только по инвайту |
| EMAIL_PROVIDER | console | console / screen / resend / brevo |
| BREVO_API_KEY, RESEND_API_KEY | — | ключ почтового провайдера |
| EMAIL_FROM | NearSoul <hello@nearsoul.app> | отправитель |
| AI_ENABLED | false | включить Anthropic |
| ANTHROPIC_API_KEY | — | ключ |
| AI_MODEL_WRITER | claude-haiku-4-5-20251001 | модель карточек/отчётов |
| AI_DAILY_BUDGET_USD | 10 | дневной лимит расходов ИИ |
| STORAGE_DRIVER | local | local / db / s3 |
| LOCAL_STORAGE_DIR | .data/storage | для local |
| S3_ENDPOINT, S3_REGION (auto), S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY | — | R2/S3 |
| WEB_DIST_DIR | — | путь к собранному вебу (отдаётся API) |
| PUBLIC_API_URL / APP_PUBLIC_URL | localhost | публичные адреса (на Render берётся RENDER_EXTERNAL_URL) |
| PAYWALL_ENABLED | false | включить уровни и платный контент |
| LAUNCH_CITY | amsterdam | город запуска |
| DAILY_SET_SIZE | 15 (alpha: 200) | базовый размер «Душ дня», 1–300 |
| TERMS_VERSION | 2026-10-alpha | версия условий |
| SOUL_TALK_ENABLED | false | Soul Talk |
| SOUL_MASTER_KEY | — | мастер-ключ шифрования Soul Talk (base64 32 байта) |
| SOUL_MODEL / SOUL_SAFETY_MODEL | claude-sonnet-5-5 / claude-haiku-4-5-20251001 | модели Soul Talk |
| SOUL_TRANSCRIPT_TTL_DAYS | 90 | хранение транскриптов |
| CRISIS_RESOURCES | — | JSON горячих линий по странам |
| CRISIS_TEXTS_APPROVED | false | основатель утвердил кризисные тексты |
| ADMIN_BOOTSTRAP_EMAIL | — | первый админ (пароль + TOTP один раз в логе) |
| POSTHOG_KEY / POSTHOG_HOST | — / eu.i.posthog.com | аналитика |
| REVENUECAT_WEBHOOK_AUTH | — (≥ 16) | секрет вебхука |
| VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT | авто-генерация в app_secrets | Web Push |
| FCM_SERVICE_ACCOUNT_JSON | — | нативный push |

Клиент (dart-define): `API_URL` (пусто на вебе = свой origin), `APP_ENV`, `APP_VERSION`, `BUILD_NUMBER`.

## 4. Общие правила API

- Префикс `/v1`. JSON. Аутентификация: `Authorization: Bearer <access JWT>`; веб получает refresh в httpOnly cookie (`x-client: web`).
- Ошибки: HTTP-статус + `{"error": {"code": "SNAKE_CASE", "message": "...", "request_id": "...", "details": {...}}}`. Коды: 400 `VALIDATION_*`/доменные, 401 `UNAUTHENTICATED`, 402 `UPGRADE_REQUIRED`, 403, 404 (в том числе вместо 403, чтобы не раскрывать существование), 409, 429 `RATE_LIMITED`/`LIKE_LIMIT`/`REQUEST_LIMIT` с `retry_after`.
- Валидация тел запросов: zod `.strict()` (лишние поля → 400).
- Гейты: `@RequireGate('active')` — пользователь прошёл онбординг; `@Public()` — без токена.
- `Cache-Control: no-store` на всём `/v1`, кроме `/v1/media/*` (private, 600 с) и `/v1/tiles/*` (public, 7 дней).

## 5. Маршруты API

### Auth `/v1/auth`
| Метод | Путь | Тело / ответ |
|---|---|---|
| POST | code | `{email}` → 202 `{status:"sent", testCode?}` (testCode только при screen) |
| POST | verify | `{email, code, inviteCode?}` → `{accessToken, refreshToken?, expiresIn, user}` |
| POST | refresh | cookie или `{refreshToken}` → новая пара |
| POST | logout / logout-all | завершить сессию / все |
| POST | switch | `{userId}` — переключить персону |

### Я `/v1/me`
`GET /` · `PATCH /` (discoveryEnabled, timezone, notifyPrefs, …) · `POST dob {dob}` · `GET/POST consents {terms, alphaTerms, optional{}}` · `PATCH share-level {level: minimal|standard|deep}` · `POST onboarding/skip` · `POST onboarding/complete` · `POST sensitive-code` · `POST delete` (нужен свежий код) · `GET/POST/PATCH personas` · `POST/GET export` · `GET/POST/PATCH card` (+`POST card/generate`) · `GET/POST invites`

### Профиль
`GET/PUT/PATCH /v1/me/profile` · `POST /v1/photos` (multipart `photo`, до 6) · `PATCH /v1/photos/order` · `DELETE /v1/photos/:id` · `GET /v1/interests` · `GET /v1/cities`

### Движок
`GET /v1/engine/questionnaires/:id` (quick, deep1..4) · `PUT /v1/engine/answers/:itemKey {value}` · `GET /v1/engine/progress` · `GET /v1/me/soul-profile` · `PATCH /v1/me/soul-profile/layers` · `POST /v1/me/soul-profile/retake`

### Знакомства
| Метод | Путь | Описание |
|---|---|---|
| GET | /v1/daily-set?offset=0&limit=30 | `{date, refreshAt, total, offset, actedCount, remaining, cards[], needsAnswers, viewerBlocked}`; карточка: id, имя, возраст, город/диапазон, фото (подписанные URL), архетип, `match{percent, tier, reasons[2], moreCount}`, personaCount (только VIP) |
| GET | /v1/profiles/:id | публичный профиль (только если зритель может его видеть) |
| POST | /v1/likes | `{targetId, action: like|pass, source: daily|nearby|profile}` → `{action, match|null}` |
| GET | /v1/likes/received | `{count, canSee, ids[]}` (ids только Gold+) |
| POST | /v1/likes/rewind | отменить последний пропуск за 24 ч (Gold+) |
| POST | /v1/requests | `{targetId, text}` — «написать первым» (VIP, 5/день) |
| GET | /v1/requests | входящие запросы |
| POST | /v1/requests/:id/accept, /decline | принять (матч + сообщение) / отклонить |
| GET | /v1/matches | список матчей с последним сообщением и непрочитанными |
| DELETE | /v1/matches/:id | отменить матч |
| GET/POST | /v1/matches/:id/messages | история (по 50, курсор) / отправить |
| POST | /v1/matches/:id/read | прочитано |
| GET | /v1/matches/:id/report, /v1/reports/self | отчёты |

### Рядом и карта
| Метод | Путь | Описание |
|---|---|---|
| POST | /v1/location | `{lat, lng, accuracyM, capturedAt?}`; отказ при accuracy > 500 м; 30/час; нужно discovery, Open to meet или показ на карте |
| POST | /v1/nearby/open | `{durationMin: 60|120|240, radiusM: 500|1000|3000|10000, activity?}`; 3 раза в день |
| POST | /v1/nearby/close · GET /v1/nearby/status · GET /v1/nearby/list · POST /v1/nearby/later | |
| GET | /v1/map | `{me:{lat,lng,updatedAt,simulated}|null, sharing:{until|null}|null, friends:[{userId, matchId, firstName, photo, lat, lng, approxM, updatedAt}]}` |
| POST | /v1/map/share | `{durationMin: 60 | 240 | null}` (null = до выключения) |
| POST | /v1/map/stop | выключить |
| GET | /v1/tiles/{z}/{x}/{y}.png | публичный кэширующий прокси OSM, z ≤ 17, 600 запросов/мин на IP |

### Уведомления
`GET /v1/push/config` · `GET /v1/notifications` · `POST /v1/notifications/read-all` · `POST /v1/notifications/:id/read` · `POST/DELETE /v1/devices`. Realtime-события: `match.new`, `message.new`, `notification.new`, …

### Soul Talk (за флагом)
`GET /v1/soul/topics` · `POST/GET /v1/soul/sessions` · `GET /v1/soul/sessions/:id` · `POST …/messages` · `POST …/continue` · `POST …/finish` · `DELETE …/:id` · `DELETE /v1/soul/data` · `GET /v1/soul/insights` · `PATCH /v1/soul/insights/:id` · `GET /v1/me/soul-map` · `PATCH /v1/me/soul-settings`

### Безопасность
`POST /v1/blocks {userId}` · `GET /v1/blocks` · `DELETE /v1/blocks/:userId` · `POST /v1/reports-moderation` · `POST /v1/feedback` · `POST /v1/ratings`

### Оплата и реклама
`GET /v1/billing/status` → `{tier, features, testPurchases, tiers:[{tier, features, price}]}` · `POST /v1/billing/test-activate {tier}` (только alpha/dev/test) · `POST /v1/billing/webhook` (RevenueCat, заголовок авторизации) · `GET /v1/ads` → `{ads[], every: 10}` (пусто для Gold/VIP) · `POST /v1/ads/:id/impression|click`

### Альфа `/v1/alpha` (только alpha/dev/test и role=tester)
`GET presets` · `POST location {presetId}|{lat,lng}` · `POST daily-set/reset` · `GET engine-debug/me` · `GET engine-debug/match/:id`

### Админ `/admin/v1` (отдельная авторизация + TOTP)
`POST login` · `GET me` · `GET queue` · `GET cases/:id` · `POST cases/:id/assign|resolve` · `POST users/:id/actions` · `GET users`, `users/:id` · `GET/POST invites` · `GET feedback`, `PATCH feedback/:id` · `GET metrics` · `GET audit`

### Служебные
`GET /health` · `GET /ready` · `GET /v1/media/:key?exp&sig` (подписанные фото)

## 6. Модель данных (47 таблиц)

Классы данных: **S1** обычные, **S2** чувствительные (ответы, профиль души, локация), **S3** строжайшие (Soul Talk: шифрование на уровне приложения, только владелец, нет доступа админа).

| Группа | Таблицы | Ключевые правила |
|---|---|---|
| Пользователь | users, profiles, profile_interests, photos, media, consents, device_tokens, sessions, auth_codes, user_data_keys | `users.parentId` — персоны (до 3); статусы onboarding/active/suspended/blocked_underage/deletion_requested/deleted |
| Справочники | cities, interests, match_config, app_secrets | match_config версионирован |
| Движок | engine_answers (с locale), soul_profiles, layer_overrides, personality_cards | ответы S2, никогда не отдаются другим |
| Подбор | daily_sets (candidateIds, size, generatedAt), likes (уник. actor+target), matches (уник. пара low/high), messages, message_requests, pair_outcomes | матч создаётся один раз при гонке |
| Гео | user_locations (1 строка на пользователя: h3Cell res 9 + центр, simulated, updatedAt; TTL 24 ч), nearby_sessions, nearby_alerts, nearby_later, map_shares (userId, until\|null) | нет истории локаций |
| Soul Talk | soul_sessions, soul_messages (шифр.), soul_insights, safety_events | S3, криптоудаление |
| Безопасность | blocks, reports, moderation_reports, moderation_actions, audit_events | |
| Прочее | notifications, invites, invite_redemptions, feedback, ratings, data_export_jobs, entitlements, billing_events, ad_cards (title/body/cta JSON по языкам, url, color, sponsor, locations JSON, isTest, active, impressions, clicks), admin_users | |

Миграции: `apps/api/prisma/migrations/` (последняя `20261018170000_map_shares`). Применение: `npx prisma migrate deploy`.

## 7. Soul Engine — формулы

### 7.1 Опросники
- Quick Scan: 10 стартовых вопросов (`STARTER_KEYS`) + 27 уточняющих. Likert-5, single, multi.
- Deep Personality: 116 вопросов IPIP-NEO-120 в 4 частях, 29 фасет (O6 исключена).
- Скоринг: обратные ключи, перевод в 0–100, полосы low/mid/high. Эмоциональная устойчивость = инверсия нейротизма. Домен Quick Scan считается с 1 ответа, confidence 0.25 (`MIN_QUICK_RATIO`).

### 7.2 Архетип
Два самых высоких домена в полосе high (порядок при равенстве O, C, E, A, S): OC Архитектор, OE Исследователь, OA Мечтатель, OS Свободный дух, CE Капитан, CA Хранитель, CS Опора, EA Солнце, ES Искатель приключений, AS Миротворец. Один high-домен → `single_X`. Ни одного → Гармонизатор.

### 7.3 Допустимость пары (`eligibility`) — до подсчёта
Не сам с собой; оба готовы к знакомствам (≥ 1 фото, профиль, discovery); взаимный пол; **взаимный** возрастной диапазон; совместимые цели; нет блока в любую сторону; не было матча; не пропущен недавно; нет дилбрейкеров. При лайке собственный возрастной фильтр актора не применяется (набор мог быть расширен).

### 7.4 Совместимость (`compatibility`)
Помощники: `sim(a,b)=1−|a−b|/100`, `level(a,b)=(a+b)/200`, `ord(a,b,n)=1−|a−b|/(n−1)`, `overlap(A,B,k)=|A∩B|/k`.

| Слой (вес) | Измерение (вес) | Формула |
|---|---|---|
| Ценности (0.30) | values (0.5) | overlap(top3) |
| | kids_plan (0.3) | таблица |
| | life_direction (0.2) | одинаково 1, balance_all 0.6, иначе 0.2 |
| Отношения (0.25) | closeness (0.25), independence (0.25) | sim |
| | reassurance fit (0.20) | 1 − max(0, rA+iB−130)/70, среднее с зеркальным |
| | conflict_style (0.20) | таблица |
| | care_language (0.10) | пересечение 1, иначе 0.4 |
| Образ жизни (0.15) | weekend (0.25), spontaneity (0.25), activity (0.2), smoking (0.15), drinking (0.15) | таблица / sim / ord |
| Общение (0.15) | texting_rhythm (0.5), depth (0.5) | ord / sim |
| Личность (0.15) | O 0.25, C 0.20 | sim |
| | E 0.15 | 0.7·sim + 0.3 |
| | A 0.20, S 0.20 | 0.5·sim + 0.5·level |

`score = 100 × intentMultiplier × Σ(wL·layerL) / Σ(wL известных)`. Неизвестные данные исключаются (не считаются нулём). Уровни: ≥ 75 сильное, 55–74 хорошее, 35–54 есть общее, < 35 последним. Процент для пользователя: `round(score/5)·5`. Причины: 2 на карточке, до 3 в профиле, до 6 в отчёте; трения 0–1 на карточке.

Обязательные тесты: симметрия, 0–100, детерминизм, отсутствие данных не снижает балл, несовместимые цели не доходят до подсчёта, golden-снимки 20 пар.

### 7.5 «Души дня» (`rankDailySet`)
`rank = score × freshness × newUserBoost`, где freshness: ≤ 1 дня 1.0, ≤ 7 дней 0.95, ≤ 30 дней 0.8, иначе 0.6; новичок (≤ 7 дней) ×1.1. Сортировка: по уровню совпадения, внутри уровня реальные раньше демо, затем rank. Не больше 3 одинаковых архетипов подряд. Расширение возраста шагами +2 и +4 года, если включён гибкий режим. Исключаются показанные за последние дни. Набор стабилен в течение дня; дополняется при апгрейде уровня или раз в 2 минуты, если людей меньше лимита.

## 8. Уровни и лимиты

| Параметр | Free | Soul+ | Gold | VIP |
|---|---|---|---|---|
| «Души дня» и лайки/день | base (15; alpha 200) | max(25, base×1.25) | max(50, base×1.5) | без лимита (технический потолок 500) |
| Полные отчёты | — | ✓ | ✓ | ✓ |
| Кто лайкнул (список) | только число | только число | ✓ | ✓ |
| Rewind | — | — | ✓ | ✓ |
| Реклама | ✓ | ✓ | — | — |
| Число профилей у человека | — | — | — | ✓ |
| Написать первым | — | — | — | ✓ 5/день |

Прочие лимиты: код входа — 10 мин, 5 попыток, повтор через 60 с, 3 кода за 15 мин, 10 запросов кода/ч и 30 проверок/ч с IP; access 15 мин; refresh 30 дней; фото 1–6; персоны 3; Open to meet 3 раза/день, окна 60/120/240 мин, радиусы 500 м/1/3/10 км; алертов 5 за окно, пара не чаще раза в 7 дней, задержка 0–3 мин, порог совместимости 55; локация 30 обновлений/ч, точность ≤ 500 м, скорость > 300 км/ч помечается; свежая локация 15 мин; TTL локации 24 ч; на карте — точка не старше 6 ч, H3 res 8, округление 100 м, круг 350 м; реклама каждые 10 карточек, перерыв каждые 50; клиент грузит набор по 30.

## 9. Клиент: экраны и маршруты

| Путь | Экран |
|---|---|
| /welcome, /auth/email, /auth/code | вход |
| /onboarding/dob, consents, scan, reveal, share, basics, photos, interests, discovery | онбординг |
| /today, /today/profile/:id | «Души дня», профиль кандидата |
| /nearby, /nearby/map | «Рядом», карта матчей |
| /soul, /soul/report | Душа, отчёт о себе (+ Soul Talk за флагом) |
| /matches, /matches/:id, /matches/:id/report | матчи, чат, «Вы двое» |
| /me, /me/edit, photos, interests, settings, profiles, subscription, notifications, feedback, invites, alpha, blocked, safety, about, delete | «Я» |
| /mobile.html | рамка телефона для показа на компьютере |

Брейкпоинты: < 600 компактный, 600–1023 средний, ≥ 1024 широкий. Каждый экран обязан работать во всех трёх и иметь состояния загрузки, пустоты, ошибки, нет сети, нет разрешения.

## 10. Тесты и качество

| Команда | Что проверяет |
|---|---|
| `cd apps/api && npm run lint` | ESLint (в т.ч. запреты в движке) |
| `cd apps/api && npx tsc --noEmit` | типы |
| `cd apps/api && npx jest src/engine --coverage` | движок, порог 95 % |
| `cd apps/api && npm test` | все 26 наборов (254 теста), e2e на реальном Postgres |
| `cd apps/app && flutter analyze && flutter test` | клиент |
| `bash scripts/build-web-dist.sh` | сборка веба в deploy/web |

Обязательные виды e2e-тестов для новых функций: права доступа (чужой id → 404), приватность (нет `lat/lng/h3Cell/distanceM` в ответах другим, кроме карты матчей), лимиты, работа флагов в обоих состояниях.

## 11. Сборка и деплой

- Локально: `node scripts/dev-db.mjs start` → `npx prisma migrate deploy` → `npm run seed && npm run seed:demo` → `node --env-file=.env dist/main.js`.
- Веб: `scripts/build-web-dist.sh` собирает Flutter web в `deploy/web` (коммитится).
- Render: build `npm ci && prisma generate && tsc`; start `migrate deploy → seed.ts → seed-demo.ts (в фоне) → node dist/main.js`; health `/ready`. Деплой: «Manual Deploy → Deploy latest commit» (autoDeploy тоже включён).
- Демо-сид: 200 демо-людей (`DEMO_COUNT`), лишние удаляются, портреты перерисовываются по версии в `app_secrets.demo_avatar_version`.

## 12. Правила для разработчика и агента (обязательные)

1. Читать `docs/prd/`, CR, этот пакет, `CLAUDE.md` перед изменениями.
2. Одна вертикальная задача за раз: миграция + API + экран (3 брейкпоинта) + тесты.
3. ID требований (ENG-012, GEO-004, CR-29…) в коммитах и тестах.
4. Движок: без I/O, `Date.now()`, `Math.random()`; веса только в match_config; повышать `ENGINE_VERSION` при изменении формул.
5. Приватность: §8 документа 2. Никаких сырых баллов наружу (только округлённый процент).
6. Платное — только на сервере; заблокированные данные не отправлять клиенту вообще.
7. Альфа-функции под `demoAllowed()` и проверкой `APP_ENV`.
8. После задачи: lint → typecheck → tests → build → запись в `docs/implementation-status.md` с командами и результатами.
9. Изменения PRD — только CR в `docs/prd-change-requests.md`.
10. Не коммитить секреты. `.env` не в git.
11. Миграции только новыми файлами, проверка через `migrate deploy` + e2e. **Никогда** `migrate diff` с shadow = рабочая БД.
12. Flutter: не форматировать целые файлы `dart format`; после UI-изменений пересобирать `deploy/web`.
