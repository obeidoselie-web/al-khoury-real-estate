import { LOCALE_META, type Locale } from './config';

/**
 * Plural forms keyed by CLDR category. English uses one/other; Arabic uses all six
 * (zero, one, two, few, many, other). `{count}` is replaced with the formatted number.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

const rulesCache = new Map<Locale, Intl.PluralRules>();
const numberCache = new Map<Locale, Intl.NumberFormat>();

function rules(locale: Locale): Intl.PluralRules {
  let r = rulesCache.get(locale);
  if (!r) rulesCache.set(locale, (r = new Intl.PluralRules(LOCALE_META[locale].intl)));
  return r;
}

export function formatNumber(value: number, locale: Locale): string {
  let f = numberCache.get(locale);
  if (!f) numberCache.set(locale, (f = new Intl.NumberFormat(LOCALE_META[locale].intl, { maximumFractionDigits: 0 })));
  return f.format(value);
}

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const template = forms[rules(locale).select(count)] ?? forms.other;
  return template.replaceAll('{count}', formatNumber(count, locale));
}

/** Replaces `{name}` placeholders. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
