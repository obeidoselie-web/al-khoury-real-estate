import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

import * as schema from './schema';

/*
 * One libSQL connection per server process.
 *  - DATABASE_URL: `file:data/alkhoury.db` by default (a local SQLite file, gitignored). Set it to a
 *    `libsql://…` URL plus DATABASE_AUTH_TOKEN to use Turso; nothing else changes.
 *  - Migrations are applied by `npm run db:migrate` (run automatically before dev/build/start),
 *    not lazily at request time, so parallel build workers never race on DDL.
 */

export type Db = LibSQLDatabase<typeof schema>;

export const DEFAULT_DATABASE_URL = 'file:data/alkhoury.db';
export const MIGRATIONS_FOLDER = path.join(process.cwd(), 'drizzle');

interface Connection {
  url: string;
  client: Client;
  db: Db;
  ready: Promise<void>;
}

const globalForDb = globalThis as typeof globalThis & { __akDb?: Connection };

function databaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

function open(url: string): Connection {
  if (url.startsWith('file:')) {
    const file = url.slice('file:'.length);
    if (file && file !== ':memory:') mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  const db = drizzle(client, { schema });
  const ready = url.startsWith('file:')
    ? client
        .executeMultiple('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;')
        .then(() => undefined)
    : Promise.resolve();
  return { url, client, db, ready };
}

function connection(): Connection {
  const url = databaseUrl();
  const current = globalForDb.__akDb;
  if (current && current.url === url) return current;
  current?.client.close();
  const next = open(url);
  globalForDb.__akDb = next;
  return next;
}

/** The database, ready to query. */
export async function getDb(): Promise<Db> {
  const { db, ready } = connection();
  await ready;
  return db;
}

/** Applies pending migrations from ./drizzle. */
export async function migrateDb(): Promise<void> {
  const db = await getDb();
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

/** Closes the connection (scripts and tests). */
export function closeDb(): void {
  globalForDb.__akDb?.client.close();
  globalForDb.__akDb = undefined;
}

export { schema };
