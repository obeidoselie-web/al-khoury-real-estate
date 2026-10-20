import type { Metadata } from 'next';

import { LOCALES, localizedPath, type Locale } from '@/i18n/config';

/** Canonical URL plus hreflang alternates for every language version of a path. */
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: localizedPath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localizedPath(l, path)])),
      'x-default': localizedPath('en', path),
    },
  };
}
