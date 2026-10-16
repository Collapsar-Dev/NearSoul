import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/** Starts the local Postgres (no Docker needed) and applies migrations to the test database. */
export default async function globalSetup(): Promise<void> {
  const root = join(__dirname, '../../..');
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://ns:ns@localhost:54329/nearsoul_test';
  if (!process.env.TEST_DATABASE_URL) execFileSync('node', [join(root, 'scripts/dev-db.mjs'), 'start'], { stdio: 'ignore' });
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'ignore',
  });
  execFileSync('npx', ['tsx', 'prisma/seed.ts'], { cwd: join(__dirname, '..'), env: { ...process.env, DATABASE_URL: url }, stdio: 'ignore' });
}
