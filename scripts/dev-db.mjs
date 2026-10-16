#!/usr/bin/env node
/**
 * Local PostgreSQL without Docker or sudo, using the embedded-postgres binaries.
 * Usage: node scripts/dev-db.mjs start|stop|status|reset
 * Creates databases nearsoul_dev and nearsoul_test (user/password: ns/ns) on PGPORT (default 54329).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'apps/api/package.json'));
const bin = join(root, 'node_modules/@embedded-postgres/linux-x64/native/bin');
const dataDir = join(root, '.data/pg');
const port = process.env.PGPORT ?? '54329';
const pgCtl = (...args) => spawnSync(join(bin, 'pg_ctl'), ['-D', dataDir, ...args], { stdio: 'inherit' });

function init() {
  if (existsSync(join(dataDir, 'PG_VERSION'))) return;
  mkdirSync(dataDir, { recursive: true });
  const pw = join(root, '.data/pwfile');
  writeFileSync(pw, 'ns\n');
  execFileSync(join(bin, 'initdb'), ['-D', dataDir, '-U', 'ns', `--pwfile=${pw}`, '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C'], { stdio: 'inherit' });
  rmSync(pw);
}

async function createDatabases() {
  const pg = require('pg');
  const client = new pg.Client({ host: 'localhost', port: Number(port), user: 'ns', password: 'ns', database: 'postgres' });
  await client.connect();
  for (const db of ['nearsoul_dev', 'nearsoul_test']) {
    const { rowCount } = await client.query('select 1 from pg_database where datname = $1', [db]);
    if (!rowCount) await client.query(`create database ${db}`);
  }
  await client.end();
}

const cmd = process.argv[2] ?? 'start';
if (cmd === 'start') {
  init();
  if (pgCtl('status').status !== 0) {
    const r = pgCtl('-l', join(root, '.data/pg.log'), '-o', `-p ${port} -c unix_socket_directories= -c listen_addresses=localhost`, '-w', 'start');
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  await createDatabases();
  console.log(`Postgres ready: postgresql://ns:ns@localhost:${port}/nearsoul_dev`);
} else if (cmd === 'stop') {
  pgCtl('-m', 'fast', 'stop');
} else if (cmd === 'status') {
  process.exit(pgCtl('status').status ?? 1);
} else if (cmd === 'reset') {
  pgCtl('-m', 'fast', 'stop');
  rmSync(dataDir, { recursive: true, force: true });
  console.log('Data removed. Run `start` again.');
} else {
  console.error('Usage: dev-db.mjs start|stop|status|reset');
  process.exit(1);
}
