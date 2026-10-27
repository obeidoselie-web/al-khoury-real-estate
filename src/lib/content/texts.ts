/*
 * Editable website text. Every string in the dictionaries can be overridden per language from the
 * admin; overrides are stored by path ("home.heroTitle", "company.address") and applied over the
 * bundled dictionary, so an untouched string keeps tracking the code's default.
 *
 * Kinds of leaf:
 *  - text:  a single string
 *  - lines: an array of strings, edited one per line (address lines)
 * Arrays of objects (opening hours, values) are addressed by index: "about.values.0.title".
 */

export type TextKind = 'text' | 'lines';
export type TextValue = string | string[];

export interface TextEntry {
  path: string;
  kind: TextKind;
  value: TextValue;
}

type Tree = Record<string, unknown> | unknown[];

export function flattenTexts(tree: unknown, prefix = ''): TextEntry[] {
  const out: TextEntry[] = [];
  const visit = (node: unknown, path: string) => {
    if (typeof node === 'string') out.push({ path, kind: 'text', value: node });
    else if (Array.isArray(node)) {
      if (node.every((item) => typeof item === 'string')) out.push({ path, kind: 'lines', value: node as string[] });
      else node.forEach((item, index) => visit(item, `${path}.${index}`));
    } else if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) visit(child, path ? `${path}.${key}` : key);
    }
  };
  visit(tree, prefix);
  return out;
}

export function getAt(tree: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), tree);
}

function kindOf(value: unknown): TextKind | null {
  if (typeof value === 'string') return 'text';
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return 'lines';
  return null;
}

/** Returns a copy of `base` with each override applied; unknown paths or mismatched kinds are ignored. */
export function applyOverrides<T>(base: T, overrides: Record<string, TextValue>): T {
  const entries = Object.entries(overrides);
  if (entries.length === 0) return base;
  const copy = structuredClone(base) as Tree;
  for (const [path, value] of entries) {
    const keys = path.split('.');
    const last = keys.pop()!;
    const parent = keys.reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), copy);
    if (!parent || typeof parent !== 'object' || !(last in parent)) continue;
    const current = (parent as Record<string, unknown>)[last];
    const kind = kindOf(current);
    if (!kind || kind !== kindOf(value)) continue;
    (parent as Record<string, unknown>)[last] = value;
  }
  return copy as T;
}

/** "{year}" style placeholders the code fills in. */
export function placeholders(value: TextValue): string[] {
  const text = Array.isArray(value) ? value.join('\n') : value;
  return [...new Set(text.match(/\{[a-zA-Z]+\}/g) ?? [])].sort();
}

/** Why an edited value can't be saved, or null. */
export function overrideProblem(defaultValue: TextValue, value: TextValue): string | null {
  const missing = placeholders(defaultValue).filter((p) => !placeholders(value).includes(p));
  if (missing.length) return `Keep ${missing.join(' and ')} — the site fills ${missing.length === 1 ? 'it' : 'them'} in.`;
  if (typeof value === 'string' && !value.trim()) return 'Can’t be empty. Use Reset to restore the default.';
  if (Array.isArray(value) && value.length === 0) return 'Add at least one line.';
  return null;
}

/** Human labels for dictionary sections in the admin. */
export const SECTION_LABELS: Record<string, string> = {
  meta: 'Search engines & browser tabs',
  company: 'Company name, address & hours',
  nav: 'Header, footer & navigation',
  home: 'Home page',
  types: 'Property types',
  regions: 'Regions',
  deals: 'Sale / rent labels',
  listings: 'Properties page & filters',
  card: 'Property cards',
  format: 'Number & price formats',
  property: 'Property page',
  sell: 'List your property (owners)',
  saved: 'Saved properties',
  about: 'About page',
  contact: 'Contact form',
  errors: 'Error pages',
  settings: 'Appearance & language dialog',
};

/** "home.search.whereAny" → "Search › Where any". */
export function labelForPath(path: string): string {
  return path
    .split('.')
    .slice(1)
    .map((part) =>
      /^\d+$/.test(part)
        ? `#${Number(part) + 1}`
        : part.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()),
    )
    .join(' › ');
}
