import type { Locale } from '../config';
import { ar } from './ar';
import { en, type Dictionary } from './en';

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

/** Both dictionaries are small and static, so they are bundled rather than lazy-loaded. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
