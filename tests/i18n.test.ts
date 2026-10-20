import { describe, expect, it } from 'vitest';

import { isLocale, localeFromPath, localizedPath, negotiateLocale, switchLocalePath } from '@/i18n/config';
import { ar } from '@/i18n/dictionaries/ar';
import { en } from '@/i18n/dictionaries/en';
import { interpolate, plural } from '@/i18n/plural';

type Node = unknown;

function isPluralForms(value: Node): value is Record<string, string> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'other' in value;
}

/** Walks two dictionaries in parallel and reports structural differences. */
function diff(a: Node, b: Node, path = ''): string[] {
  if (typeof a === 'string') return typeof b === 'string' && b.trim() ? [] : [`${path}: missing or empty`];
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return [`${path}: array length differs`];
    return a.flatMap((item, i) => diff(item, b[i], `${path}[${i}]`));
  }
  if (isPluralForms(a)) {
    if (!isPluralForms(b)) return [`${path}: expected plural forms`];
    // Arabic needs one/two/few/many/other to read naturally for any count.
    return ['one', 'two', 'few', 'many', 'other'].filter((k) => !b[k]).map((k) => `${path}.${k}: missing Arabic plural`);
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return [`${path}: missing section`];
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const extra = keysB.filter((k) => !keysA.includes(k)).map((k) => `${path}.${k}: not in English`);
    return [
      ...extra,
      ...keysA.flatMap((k) => diff((a as Record<string, Node>)[k], (b as Record<string, Node>)[k], `${path}.${k}`)),
    ];
  }
  return [];
}

describe('dictionaries', () => {
  it('Arabic covers every English key, with full Arabic plural forms', () => {
    expect(diff(en, ar)).toEqual([]);
  });

  it('keeps placeholders consistent between languages', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    const pairs: [string, string][] = [
      [en.about.title, ar.about.title],
      [en.contact.defaultMessage, ar.contact.defaultMessage],
      [en.contact.errors.message, ar.contact.errors.message],
      [en.property.call, ar.property.call],
      [en.errors.stillNot, ar.errors.stillNot],
      [en.listings.noneOf, ar.listings.noneOf],
      [en.format.perMonth, ar.format.perMonth],
    ];
    for (const [a, b] of pairs) expect(placeholders(b)).toBe(placeholders(a));
  });
});

describe('plural', () => {
  it('selects CLDR categories per locale', () => {
    const forms = ar.listings.anyProperty;
    expect([1, 2, 5, 11, 100].map((n) => plural('ar', n, forms))).toEqual([
      'عقار واحد',
      'عقاران',
      '5 عقارات',
      '11 عقارًا',
      '100 عقار',
    ]);
    expect(plural('en', 1, en.listings.anyProperty)).toBe('1 property');
    expect(plural('en', 1200, en.listings.anyProperty)).toBe('1,200 properties');
  });

  it('interpolates named placeholders and leaves unknown ones', () => {
    expect(interpolate('Call {phone} {x}', { phone: '+961' })).toBe('Call +961 {x}');
  });
});

describe('locale routing helpers', () => {
  it('validates locales', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('builds and swaps locale prefixes', () => {
    expect(localizedPath('ar')).toBe('/ar');
    expect(localizedPath('en', '/listings')).toBe('/en/listings');
    expect(localeFromPath('/ar/listings/x')).toBe('ar');
    expect(localeFromPath('/arabic')).toBeNull();
    expect(switchLocalePath('/en/listings/villa-1', 'ar')).toBe('/ar/listings/villa-1');
    expect(switchLocalePath('/ar', 'en')).toBe('/en');
    expect(switchLocalePath('/about', 'ar')).toBe('/ar/about');
  });

  it('negotiates the locale: cookie, then Accept-Language by quality, then English', () => {
    expect(negotiateLocale('ar-LB,ar;q=0.9,en;q=0.8')).toBe('ar');
    expect(negotiateLocale('fr-FR,fr;q=0.9,ar;q=0.5,en;q=0.7')).toBe('en');
    expect(negotiateLocale('fr-FR,de;q=0.8')).toBe('en');
    expect(negotiateLocale('en;q=0.2, ar;q=0.9')).toBe('ar');
    expect(negotiateLocale('ar;q=0')).toBe('en');
    expect(negotiateLocale(null)).toBe('en');
    expect(negotiateLocale('en-US', 'ar')).toBe('ar');
    expect(negotiateLocale('ar', 'xx')).toBe('ar');
  });
});
