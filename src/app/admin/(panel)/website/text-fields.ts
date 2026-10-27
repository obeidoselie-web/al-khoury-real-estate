import 'server-only';

import { getDictionary } from '@/i18n/dictionaries';
import { getAt, labelForPath, type TextValue } from '@/lib/content/texts';
import { getOverrides } from '@/lib/data/site-store';

import type { TextFieldData } from './WebsiteForm';

export type TextSpec = string | { path: string; label?: string; hint?: string };

/** Current and default values, in both languages, for the given dictionary paths. */
export async function buildTextFields(specs: TextSpec[]): Promise<TextFieldData[]> {
  const [enOver, arOver] = await Promise.all([getOverrides('en'), getOverrides('ar')]);
  const en = getDictionary('en');
  const ar = getDictionary('ar');
  return specs.flatMap((spec) => {
    const { path, label, hint } = typeof spec === 'string' ? { path: spec, label: undefined, hint: undefined } : spec;
    const enDefault = getAt(en, path) as TextValue | undefined;
    const arDefault = getAt(ar, path) as TextValue | undefined;
    if (enDefault === undefined || arDefault === undefined) return [];
    return [
      {
        path,
        kind: Array.isArray(enDefault) ? ('lines' as const) : ('text' as const),
        label: label ?? labelForPath(path),
        hint,
        en: { value: enOver[path] ?? enDefault, default: enDefault },
        ar: { value: arOver[path] ?? arDefault, default: arDefault },
      },
    ];
  });
}
