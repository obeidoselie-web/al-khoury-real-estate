import { readFileSync } from 'node:fs';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { AppearanceSettings } from '@/components/AppearanceSettings';
import { getDictionary } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';
import { parseSettings } from '@/lib/admin/website-form';
import {
  APPEARANCE_STORAGE_KEY,
  THEMES,
  appearanceInitScript,
  applyAppearance,
  parseAppearance,
  saveAppearance,
  siteDefaults,
} from '@/lib/appearance';
import { DEFAULT_SITE, publicContact, resolveSite } from '@/lib/site';

const root = document.documentElement;

afterEach(() => {
  localStorage.clear();
  for (const attr of ['data-theme', 'data-scheme', 'data-text', 'data-contrast', 'data-motion']) root.removeAttribute(attr);
});

describe('colour themes', () => {
  it('accepts the new themes and marks the dark ones', () => {
    expect(parseAppearance(JSON.stringify({ theme: 'cedar' })).theme).toBe('cedar');
    expect(parseAppearance(JSON.stringify({ theme: 'neon' })).theme).toBe('system');

    applyAppearance({ ...siteDefaults(), theme: 'midnight' }, root);
    expect(root.getAttribute('data-theme')).toBe('midnight');
    expect(root.getAttribute('data-scheme')).toBe('dark');

    applyAppearance({ ...siteDefaults(), theme: 'ivory' }, root);
    expect(root.getAttribute('data-theme')).toBe('ivory');
    expect(root.hasAttribute('data-scheme')).toBe(false);
  });

  it('every theme has its tokens and a dialog preview', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const dialogCss = readFileSync('src/components/AppearanceSettings.module.css', 'utf8');
    for (const theme of THEMES.filter((t) => t !== 'system' && t !== 'light')) {
      expect(css, theme).toContain(`:root[data-theme='${theme}'] {`);
    }
    for (const theme of ['ivory', 'cedar', 'coastal', 'midnight']) expect(dialogCss).toContain(`[data-preview='${theme}']`);
  });

  it('the pre-paint script applies the site default until the visitor chooses', () => {
    new Function(appearanceInitScript('coastal'))();
    expect(root.getAttribute('data-theme')).toBe('coastal');

    root.removeAttribute('data-theme');
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: 'midnight' }));
    new Function(appearanceInitScript('coastal'))();
    expect(root.getAttribute('data-theme')).toBe('midnight');
    expect(root.getAttribute('data-scheme')).toBe('dark');
  });

  it('a choice matching the site default is not stored, so a later default change still reaches the visitor', () => {
    saveAppearance(siteDefaults('cedar'), siteDefaults('cedar'));
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
    saveAppearance({ ...siteDefaults('cedar'), theme: 'light' }, siteDefaults('cedar'));
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY)!).theme).toBe('light');
  });

  it('the admin default is validated', () => {
    expect(resolveSite({ appearance: { defaultTheme: 'neon' } }).appearance.defaultTheme).toBe('system');
    const form = new FormData();
    form.set('__settings', 'appearance.defaultTheme');
    form.set('s.appearance.defaultTheme', 'ivory');
    expect(parseSettings(form, DEFAULT_SITE).settings.appearance.defaultTheme).toBe('ivory');
    form.set('s.appearance.defaultTheme', 'neon');
    expect(parseSettings(form, DEFAULT_SITE).errors['s.appearance.defaultTheme']).toBeTruthy();
  });

  it('the dialog offers every theme, starts on the site default and resets to it', async () => {
    const user = userEvent.setup();
    const site = { ...DEFAULT_SITE, appearance: { defaultTheme: 'ivory' as const } };
    render(
      <I18nProvider locale="en" dictionary={getDictionary('en')} contact={publicContact(site)}>
        <AppearanceSettings />
      </I18nProvider>,
    );
    await user.click(screen.getByRole('button', { name: /appearance/i }));
    for (const name of ['System', 'Light', 'Dark', 'Ivory', 'Cedar', 'Coastal', 'Midnight']) {
      expect(screen.getByRole('radio', { name: new RegExp(`^${name}`) })).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: /^Ivory/ })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: /^Cedar/ }));
    expect(root.getAttribute('data-theme')).toBe('cedar');
    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByRole('radio', { name: /^Ivory/ })).toBeChecked();
    expect(root.getAttribute('data-theme')).toBe('ivory');
  });
});
