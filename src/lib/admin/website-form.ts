import { LOCALES, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

import { sanitizeText } from '../contact';
import { getAt, overrideProblem, type TextValue } from '../content/texts';
import { SETTING_CHOICES, internationalDigits, isValidPoint, resolveSite, type SiteSettings } from '../site';

/*
 * Parsing for Admin → Website forms. Field names:
 *   s.<path>          a setting, e.g. s.contact.phone, s.home.showStats (checkbox)
 *   t.<locale>.<path> a text, e.g. t.ar.home.heroTitle
 * Each form lists the settings it contains in `__settings`, so an unticked checkbox reads as "off"
 * rather than "not on this page".
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setAt(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  let node = target;
  for (const key of keys) node = node[key] as Record<string, unknown>;
  node[last] = value;
}

export function parseSettings(
  form: FormData,
  current: SiteSettings,
  { thisYear = new Date().getFullYear() } = {},
): { settings: SiteSettings; errors: Record<string, string> } {
  const settings = structuredClone(current) as unknown as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const paths = String(form.get('__settings') ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const path of paths) {
    const before = getAt(current, path);
    if (before === undefined || (typeof before === 'object' && before !== null)) continue;
    const field = `s.${path}`;
    const raw = form.get(field);

    if (typeof before === 'boolean') {
      setAt(settings, path, raw === 'on');
      continue;
    }

    if (typeof before === 'number') {
      const value = Number(String(raw ?? '').replace(/[,\s]/g, ''));
      if (String(raw ?? '').trim() === '' || !Number.isFinite(value)) {
        errors[field] = 'Enter a number.';
        continue;
      }
      if (path === 'contact.founded' && (!Number.isInteger(value) || value < 1900 || value > thisYear)) {
        errors[field] = `Enter a year between 1900 and ${thisYear}.`;
      } else if (path.startsWith('stats.') && (!Number.isInteger(value) || value < 0 || value > 10_000_000)) {
        errors[field] = 'Enter a whole number.';
      } else if (path === 'listings.columns' && (!Number.isInteger(value) || value < 2 || value > 5)) {
        errors[field] = 'Choose 2 to 5 cards per row.';
      } else if (path === 'office.zoom' && (!Number.isInteger(value) || value < 3 || value > 19)) {
        errors[field] = 'Zoom goes from 3 (country) to 19 (building).';
      } else setAt(settings, path, value);
      continue;
    }

    // Strings
    const value = sanitizeText(raw, { maxLength: 300 });
    const choices = SETTING_CHOICES[path];
    if (choices) {
      if (choices.includes(value)) setAt(settings, path, value);
      else errors[field] = 'Choose one of the options.';
      continue;
    }
    if (path === 'contact.email' && !EMAIL.test(value)) errors[field] = 'Enter a valid email address.';
    else if ((path === 'contact.phone' || path === 'contact.whatsapp') && !/^\d{8,15}$/.test(internationalDigits(value))) {
      errors[field] = 'Use the international format, e.g. +961 1 234 567.';
    } else if (path.startsWith('social.') && value && !/^https:\/\/[^\s]+\.[^\s]+/i.test(value)) {
      errors[field] = 'Paste the full link, starting with https://';
    } else setAt(settings, path, value);
  }

  const parsed = settings as unknown as SiteSettings;
  if (paths.includes('office.lat') && !errors['s.office.lat'] && !isValidPoint(parsed.office.lat, parsed.office.lng)) {
    errors['s.office.lat'] = 'Pick a point on the map.';
  }
  return { settings: resolveSite(parsed), errors };
}

export interface TextChange {
  locale: Locale;
  path: string;
  /** null = back to the default (the override is removed). */
  value: TextValue | null;
}

/** Reads every t.<locale>.<path> field, comparing with the bundled default. */
export function parseTexts(
  form: FormData,
  defaults: Record<Locale, Dictionary>,
): { changes: TextChange[]; errors: Record<string, string> } {
  const changes: TextChange[] = [];
  const errors: Record<string, string> = {};
  for (const [field, raw] of form.entries()) {
    if (!field.startsWith('t.') || typeof raw !== 'string') continue;
    const [, locale, ...rest] = field.split('.');
    const path = rest.join('.');
    if (!(LOCALES as readonly string[]).includes(locale)) continue;
    const base = getAt(defaults[locale as Locale], path);
    let value: TextValue;
    if (typeof base === 'string') {
      value = sanitizeText(raw, { maxLength: 4000, multiline: base.includes('\n') });
    } else if (Array.isArray(base) && base.every((v) => typeof v === 'string')) {
      value = sanitizeText(raw, { maxLength: 4000, multiline: true })
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    } else continue; // not an editable text path

    const problem = overrideProblem(base, value);
    if (problem) {
      errors[field] = problem;
      continue;
    }
    const same = JSON.stringify(value) === JSON.stringify(base);
    changes.push({ locale: locale as Locale, path, value: same ? null : value });
  }
  return { changes, errors };
}
