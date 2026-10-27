import 'server-only';

import { and, eq } from 'drizzle-orm';
import { cache } from 'react';

import { getDb } from '@/db';
import { contentOverrides, siteSettings } from '@/db/schema';
import type { Locale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/dictionaries';

import { applyOverrides, type TextValue } from '../content/texts';
import { DEFAULT_SITE, resolveSite, type SiteSettings } from '../site';

const SITE_KEY = 'site';

/**
 * Website settings, merged over the defaults. If the database can't be read, the site still renders
 * with the defaults rather than failing (logged once per request).
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const db = await getDb();
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, SITE_KEY));
    return resolveSite(row?.value);
  } catch (error) {
    console.error('[site] Could not read settings; using defaults:', error instanceof Error ? error.message : error);
    return DEFAULT_SITE;
  }
});

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const db = await getDb();
  const value = resolveSite(settings);
  await db
    .insert(siteSettings)
    .values({ key: SITE_KEY, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date().toISOString() } });
}

/** Edited texts for one language, by path. */
export const getOverrides = cache(async (locale: Locale): Promise<Record<string, TextValue>> => {
  try {
    const db = await getDb();
    const rows = await db.select().from(contentOverrides).where(eq(contentOverrides.locale, locale));
    return Object.fromEntries(rows.map((row) => [row.path, row.value]));
  } catch (error) {
    console.error('[site] Could not read edited texts; using defaults:', error instanceof Error ? error.message : error);
    return {};
  }
});

/** The dictionary for a language with the admin's edits applied. Use this to render pages. */
export const getSiteDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  return applyOverrides(getDictionary(locale), await getOverrides(locale));
});

/** Upserts changed texts and deletes the ones set back to their default. */
export async function saveOverrides(changes: { locale: Locale; path: string; value: TextValue | null }[]): Promise<void> {
  if (changes.length === 0) return;
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = new Map(
    (await db.select().from(contentOverrides)).map((row) => [`${row.locale}:${row.path}`, JSON.stringify(row.value)]),
  );
  for (const { locale, path, value } of changes) {
    // Skip no-ops: forms submit every field on the page, edited or not.
    const stored = existing.get(`${locale}:${path}`);
    if (value === null ? stored === undefined : stored === JSON.stringify(value)) continue;
    const where = and(eq(contentOverrides.locale, locale), eq(contentOverrides.path, path));
    if (value === null) await db.delete(contentOverrides).where(where);
    else
      await db
        .insert(contentOverrides)
        .values({ locale, path, value, updatedAt: now })
        .onConflictDoUpdate({ target: [contentOverrides.locale, contentOverrides.path], set: { value, updatedAt: now } });
  }
}
