import { defineConfig } from 'drizzle-kit';

/** `npm run db:generate` writes SQL migrations to ./drizzle after a schema change. */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
