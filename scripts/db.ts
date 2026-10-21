/*
 * Database commands (run with tsx so the app's TypeScript modules are reused):
 *   npm run db:migrate   apply pending migrations from ./drizzle
 *   npm run db:seed      migrate, then load placeholder listings/advisors and create the first admin
 *
 * First admin: ADMIN_EMAIL and ADMIN_PASSWORD from the environment (or .env.local). If ADMIN_PASSWORD
 * is unset, a random password is generated and written to data/admin-credentials.txt (gitignored) —
 * sign in, change it under "My account", then delete that file.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { closeDb, getDb, migrateDb } from '../src/db';
import { seedDatabase } from '../src/db/seed';
import { generatePassword, passwordProblem } from '../src/lib/auth/password';

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const command = process.argv[2];

  await migrateDb();
  console.log(`[db] migrations applied (${process.env.DATABASE_URL || 'file:data/alkhoury.db'})`);
  if (command === 'migrate') return;

  if (command !== 'seed') throw new Error(`Unknown command "${command}" (use migrate or seed)`);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@alkhoury.example';
  let adminPassword = process.env.ADMIN_PASSWORD;
  let generated = false;
  if (adminPassword) {
    const problem = passwordProblem(adminPassword);
    if (problem) throw new Error(`ADMIN_PASSWORD: ${problem}`);
  } else {
    adminPassword = generatePassword();
    generated = true;
  }

  const report = await seedDatabase(await getDb(), { adminEmail, adminPassword });
  console.log(
    `[db] seeded: ${report.listingsCreated} listings, ${report.advisorsCreated} advisors, admin ${report.adminCreated ? 'created' : 'already existed'}`,
  );

  if (report.adminCreated && generated) {
    const file = path.join('data', 'admin-credentials.txt');
    mkdirSync('data', { recursive: true });
    writeFileSync(file, `email: ${adminEmail}\npassword: ${adminPassword}\n`, { mode: 0o600 });
    console.log(`[db] first admin is ${adminEmail}; its generated password is in ${file}`);
  }
}

main()
  .catch((error) => {
    console.error('[db]', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
