# NearSoul

Psychology-driven dating app: the **Soul Engine** figures out who you are (Big Five + relationship, values, lifestyle and communication layers), finds people whose character and values fit you, shows you the ones nearby right now (distance only as a range), and explains why you might click.

- Product spec: [docs/prd/](docs/prd/README.md) · Agent guide: [CLAUDE.md](CLAUDE.md)
- Status per requirement: [docs/implementation-status.md](docs/implementation-status.md)
- Friends test: [docs/alpha-testers-guide.md](docs/alpha-testers-guide.md)

## Repository
```
apps/api      NestJS + Prisma API, Soul Engine (src/engine), admin web client (public/admin)
apps/app      Flutter app: web, Android, iOS, Windows, macOS, Linux
docs/         PRD, ADRs, status, guides
scripts/      dev-db.mjs (local Postgres, no Docker), serve-web.mjs (web build with SPA fallback)
render.yaml   Render blueprint for the alpha environment
```

## Run locally (no Docker, no sudo)
Requirements: Node 22+, Flutter stable (for the app).

```bash
npm ci
```
```bash
node scripts/dev-db.mjs start
```
```bash
cd apps/api && cp .env.example .env   # then fill the values (see "Local .env" below)
```
```bash
cd apps/api && npx prisma migrate deploy && npm run seed && npm run seed:demo
```
```bash
cd apps/api && npx tsc -p tsconfig.build.json && node --env-file=.env dist/main.js
```
```bash
cd apps/app && flutter build web --dart-define=API_URL=http://localhost:3000 --dart-define=APP_ENV=development
```
```bash
node scripts/serve-web.mjs apps/app/build/web
```
Open http://localhost:8080. In development, sign-in codes are printed in the API console (no email is sent).

### Local .env (development only)
```
DATABASE_URL="postgresql://ns:ns@localhost:54329/nearsoul_dev"
APP_ENV=development
JWT_SECRET=<any 32+ characters>
APP_ORIGINS=http://localhost:8080
EMAIL_PROVIDER=console
STORAGE_DRIVER=local
PUBLIC_API_URL=http://localhost:3000
APP_PUBLIC_URL=http://localhost:8080
```

### Admin panel
```bash
cd apps/api && npm run admin:create -- you@example.com admin
```
Then open http://localhost:3000/admin and sign in with the printed password and an authenticator code.

## Tests
```bash
npm test
```
Runs the Soul Engine unit/property tests and API integration tests against a real local Postgres.
```bash
cd apps/app && flutter analyze && flutter test
```
