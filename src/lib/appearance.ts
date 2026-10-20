/**
 * Appearance preferences (theme, text size, contrast, motion), stored per device in localStorage
 * and expressed as data-attributes on <html> that globals.css responds to.
 *
 * "system" values set no attribute, so the CSS media queries (prefers-color-scheme,
 * prefers-reduced-motion, prefers-contrast) stay in charge.
 */
export const APPEARANCE_STORAGE_KEY = 'ak-appearance';

export const APPEARANCE_OPTIONS = {
  theme: ['system', 'light', 'dark'],
  text: ['default', 'large', 'larger'],
  contrast: ['standard', 'more'],
  motion: ['system', 'reduce'],
} as const;

export type AppearanceKey = keyof typeof APPEARANCE_OPTIONS;
export type Appearance = { [K in AppearanceKey]: (typeof APPEARANCE_OPTIONS)[K][number] };

export const DEFAULT_APPEARANCE: Appearance = { theme: 'system', text: 'default', contrast: 'standard', motion: 'system' };

/** The data-attribute each setting maps to, and the default value that means "no attribute". */
const ATTRIBUTES: Record<AppearanceKey, string> = {
  theme: 'data-theme',
  text: 'data-text',
  contrast: 'data-contrast',
  motion: 'data-motion',
};

/** Parses stored JSON defensively: unknown keys and invalid values fall back to defaults. */
export function parseAppearance(raw: string | null | undefined): Appearance {
  const result: Appearance = { ...DEFAULT_APPEARANCE };
  if (!raw) return result;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return result;
    for (const key of Object.keys(APPEARANCE_OPTIONS) as AppearanceKey[]) {
      const value = (data as Record<string, unknown>)[key];
      if ((APPEARANCE_OPTIONS[key] as readonly unknown[]).includes(value)) {
        (result as Record<AppearanceKey, string>)[key] = value as string;
      }
    }
  } catch {
    // Corrupt storage: keep defaults.
  }
  return result;
}

export function applyAppearance(settings: Appearance, root: HTMLElement): void {
  for (const key of Object.keys(ATTRIBUTES) as AppearanceKey[]) {
    const value = settings[key];
    if (value === DEFAULT_APPEARANCE[key]) root.removeAttribute(ATTRIBUTES[key]);
    else root.setAttribute(ATTRIBUTES[key], value);
  }
}

export function loadAppearance(): Appearance {
  try {
    return parseAppearance(window.localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function saveAppearance(settings: Appearance): void {
  try {
    const isDefault = (Object.keys(DEFAULT_APPEARANCE) as AppearanceKey[]).every((k) => settings[k] === DEFAULT_APPEARANCE[k]);
    if (isDefault) window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    else window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode / blocked storage: the setting still applies for this page view.
  }
}

/**
 * Inline <head> script that applies stored preferences before first paint (no flash of the wrong
 * theme). Kept tiny and dependency-free; mirrors parseAppearance/applyAppearance (covered by a test).
 */
export const APPEARANCE_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  APPEARANCE_STORAGE_KEY,
)})||"{}"),o=${JSON.stringify(APPEARANCE_OPTIONS)},d=${JSON.stringify(DEFAULT_APPEARANCE)},a=${JSON.stringify(
  ATTRIBUTES,
)},r=document.documentElement;for(var k in o){var v=s[k];if(o[k].indexOf(v)>-1&&v!==d[k])r.setAttribute(a[k],v)}}catch(e){}})();`;
