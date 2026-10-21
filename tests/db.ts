import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll } from 'vitest';

import { closeDb, migrateDb } from '@/db';

/**
 * Gives a test file its own migrated SQLite database (and upload folder) in a temp directory.
 * tests/setup.ts points every other test at an empty in-memory database, so no test can ever
 * write to the developer's data/alkhoury.db.
 */
export function useTestDatabase(): { dir: () => string } {
  let dir = '';
  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'ak-test-'));
    process.env.DATABASE_URL = `file:${path.join(dir, 'test.db').replace(/\\/g, '/')}`;
    process.env.UPLOAD_DIR = path.join(dir, 'uploads');
    await migrateDb();
  });
  afterAll(() => {
    closeDb();
    process.env.DATABASE_URL = 'file::memory:';
    delete process.env.UPLOAD_DIR;
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Windows can keep the SQLite file locked briefly after close; the OS cleans temp later.
    }
  });
  return { dir: () => dir };
}
