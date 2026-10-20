export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie that remembers an explicit language choice (set by the language switcher). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const LOCALE_META: Record<Locale, { dir: 'ltr' | 'rtl'; label: string; intl: string; ogLocale: string }> = {
  en: { dir: 'ltr', label: 'English', intl: 'en-US', ogLocale: 'en_US' },
  // Latin digits are the norm in Lebanese property listings; Arabic-Indic digits would be `ar-LB`.
  ar: { dir: 'rtl', label: 'العربية', intl: 'ar-u-nu-latn', ogLocale: 'ar_LB' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Prefixes an app path ("/listings") with a locale ("/ar/listings"). */
export function localizedPath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** Returns the locale prefix of a pathname, if any. */
export function localeFromPath(pathname: string): Locale | null {
  const first = pathname.split('/')[1];
  return isLocale(first) ? first : null;
}

/** Swaps (or adds) the locale prefix of a pathname: "/en/listings/x" → "/ar/listings/x". */
export function switchLocalePath(pathname: string, target: Locale): string {
  const current = localeFromPath(pathname);
  const rest = current ? pathname.slice(current.length + 1) : pathname;
  return localizedPath(target, rest || '/');
}

/**
 * Picks a locale for a request without a locale prefix:
 * an explicit cookie choice wins, then the browser's Accept-Language order, then the default.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined, cookieLocale?: string | null): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { base: tag.toLowerCase().split('-')[0], q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  return ranked.find((entry) => isLocale(entry.base))?.base as Locale | undefined ?? DEFAULT_LOCALE;
}
