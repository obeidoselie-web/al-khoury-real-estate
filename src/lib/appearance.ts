/**
 * Appearance preferences (theme, text size, contrast, motion), stored per device in localStorage
 * and expressed as data-attributes on <html> that globals.css responds to.
 *
 * "system" values set no attribute, so the CSS media queries (prefers-color-scheme,
 * prefers-reduced-motion, prefers-contrast) stay in charge. Themes that are dark also set
 * data-scheme="dark", so component tweaks needn't list every dark theme.
 *
 * The site's default theme (Admin → Website) applies to visitors who haven't chosen one.
 */
export const APPEARANCE_STORAGE_KEY = 'ak-appearance';

export const THEMES = ['system', 'light', 'dark', 'ivory', 'cedar', 'coastal', 'midnight'] as const;
export type Theme = (typeof THEMES)[number];

/** Themes with dark surfaces (besides "system" on a dark device, which CSS handles). */
export const DARK_THEMES: readonly Theme[] = ['dark', 'midnight'];

export const APPEARANCE_OPTIONS = {
  theme: THEMES,
  text: ['default', 'large', 'larger'],
  contrast: ['standard', 'more'],
  motion: ['system', 'reduce'],
} as const;

export type AppearanceKey = keyof typeof APPEARANCE_OPTIONS;
export type Appearance = { [K in AppearanceKey]: (typeof APPEARANCE_OPTIONS)[K][number] };

export const DEFAULT_APPEARANCE: Appearance = { theme: 'system', text: 'default', contrast: 'standard', motion: 'system' };

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** The defaults for this site: everything standard, with the admin's chosen theme. */
export function siteDefaults(defaultTheme: Theme = 'system'): Appearance {
  return { ...DEFAULT_APPEARANCE, theme: defaultTheme };
}

/** The data-attribute each setting maps to; the "system"/standard value means "no attribute". */
const ATTRIBUTES: Record<AppearanceKey, string> = {
  theme: 'data-theme',
  text: 'data-text',
  contrast: 'data-contrast',
  motion: 'data-motion',
};

/** Parses stored JSON defensively: unknown keys and invalid values fall back to the defaults. */
export function parseAppearance(raw: string | null | undefined, defaults: Appearance = DEFAULT_APPEARANCE): Appearance {
  const result: Appearance = { ...defaults };
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
  if (DARK_THEMES.includes(settings.theme)) root.setAttribute('data-scheme', 'dark');
  else root.removeAttribute('data-scheme');
}

export function loadAppearance(defaults: Appearance = DEFAULT_APPEARANCE): Appearance {
  try {
    return parseAppearance(window.localStorage.getItem(APPEARANCE_STORAGE_KEY), defaults);
  } catch {
    return { ...defaults };
  }
}

export function isDefaultAppearance(settings: Appearance, defaults: Appearance = DEFAULT_APPEARANCE): boolean {
  return (Object.keys(defaults) as AppearanceKey[]).every((k) => settings[k] === defaults[k]);
}

/** Saves only a real choice: matching the site defaults clears storage, so later default changes reach this visitor. */
export function saveAppearance(settings: Appearance, defaults: Appearance = DEFAULT_APPEARANCE): void {
  try {
    if (isDefaultAppearance(settings, defaults)) window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    else window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode / blocked storage: the setting still applies for this page view.
  }
}

/**
 * Inline <head> script that applies stored preferences (or the site default theme) before first
 * paint, so there's no flash of the wrong theme. Tiny and dependency-free; mirrors
 * parseAppearance/applyAppearance (covered by a test).
 */
export function appearanceInitScript(defaultTheme: Theme = 'system'): string {
  return `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)})||"{}"),o=${JSON.stringify(
    APPEARANCE_OPTIONS,
  )},d=${JSON.stringify(DEFAULT_APPEARANCE)},a=${JSON.stringify(ATTRIBUTES)},k2=${JSON.stringify(DARK_THEMES)},r=document.documentElement;if(o.theme.indexOf(s.theme)<0)s.theme=${JSON.stringify(
    defaultTheme,
  )};for(var k in o){var v=s[k];if(o[k].indexOf(v)>-1&&v!==d[k])r.setAttribute(a[k],v)}if(k2.indexOf(s.theme)>-1)r.setAttribute("data-scheme","dark")}catch(e){}})();`;
}

export const APPEARANCE_INIT_SCRIPT = appearanceInitScript();
