'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { DEFAULT_SITE, publicContact, type PublicContact } from '@/lib/site';

import type { Locale } from './config';
import type { Dictionary } from './dictionaries';

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  /** Contact details from the website settings. */
  contact: PublicContact;
}

const DEFAULT_CONTACT = publicContact(DEFAULT_SITE);

const I18nContext = createContext<I18nValue | null>(null);

/** Gives client components (filters, forms, error boundaries) the active locale and its strings. */
export function I18nProvider({
  locale,
  dictionary,
  contact = DEFAULT_CONTACT,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  contact?: PublicContact;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, t: dictionary, contact }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
