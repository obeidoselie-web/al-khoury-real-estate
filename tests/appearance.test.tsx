import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppearanceSettings } from '@/components/AppearanceSettings';
import {
  APPEARANCE_INIT_SCRIPT,
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearance,
  parseAppearance,
} from '@/lib/appearance';

import { renderWithI18n } from './render';

const root = document.documentElement;
const ATTRS = ['data-theme', 'data-text', 'data-contrast', 'data-motion'];

function clearRoot() {
  for (const attr of ATTRS) root.removeAttribute(attr);
}

beforeEach(() => {
  localStorage.clear();
  clearRoot();
});

afterEach(clearRoot);

describe('appearance model', () => {
  it('parses stored settings defensively', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance('not json')).toEqual(DEFAULT_APPEARANCE);
    expect(parseAppearance('{"theme":"dark","text":"huge","motion":"reduce","extra":1}')).toEqual({
      ...DEFAULT_APPEARANCE,
      theme: 'dark',
      motion: 'reduce',
    });
  });

  it('maps settings to data-attributes, leaving "system"/default values unset', () => {
    applyAppearance({ theme: 'dark', text: 'larger', contrast: 'more', motion: 'reduce' }, root);
    expect(root.dataset).toMatchObject({ theme: 'dark', text: 'larger', contrast: 'more', motion: 'reduce' });

    applyAppearance(DEFAULT_APPEARANCE, root);
    for (const attr of ATTRS) expect(root.hasAttribute(attr)).toBe(false);
  });

  it('the inline pre-paint script applies exactly what applyAppearance would', () => {
    const stored = { theme: 'light', text: 'large', contrast: 'more', motion: 'system', junk: 'x' };
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(stored));
    new Function(APPEARANCE_INIT_SCRIPT)();
    const fromScript = ATTRS.map((a) => root.getAttribute(a));

    clearRoot();
    applyAppearance(parseAppearance(JSON.stringify(stored)), root);
    expect(ATTRS.map((a) => root.getAttribute(a))).toEqual(fromScript);
    expect(fromScript).toEqual(['light', 'large', 'more', null]);
  });

  it('the inline script survives corrupt storage', () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, '{oops');
    expect(() => new Function(APPEARANCE_INIT_SCRIPT)()).not.toThrow();
    for (const attr of ATTRS) expect(root.hasAttribute(attr)).toBe(false);
  });
});

describe('AppearanceSettings dialog', () => {
  it('opens a labelled dialog from the header button', async () => {
    const user = userEvent.setup();
    renderWithI18n(<AppearanceSettings />);
    await user.click(screen.getByRole('button', { name: 'Appearance & language' }));
    const dialog = screen.getByRole('dialog', { name: 'Appearance & language' });
    for (const group of ['Language', 'Theme', 'Text size', 'Contrast', 'Motion']) {
      expect(within(dialog).getByRole('group', { name: group })).toBeInTheDocument();
    }
    expect(within(dialog).getByRole('radio', { name: 'English' })).toBeChecked();
  });

  it('applies and persists choices immediately, and resets them', async () => {
    const user = userEvent.setup();
    renderWithI18n(<AppearanceSettings />);
    await user.click(screen.getByRole('button', { name: 'Appearance & language' }));

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('radio', { name: 'Larger' }));
    await user.click(screen.getByRole('radio', { name: 'Increased' }));
    await user.click(screen.getByRole('radio', { name: 'Reduced' }));

    expect(root.dataset).toMatchObject({ theme: 'dark', text: 'larger', contrast: 'more', motion: 'reduce' });
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? '{}')).toEqual({
      theme: 'dark',
      text: 'larger',
      contrast: 'more',
      motion: 'reduce',
    });

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    for (const attr of ATTRS) expect(root.hasAttribute(attr)).toBe(false);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBeNull();
  });

  it('restores saved settings when reopened', async () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ ...DEFAULT_APPEARANCE, theme: 'light' }));
    const user = userEvent.setup();
    renderWithI18n(<AppearanceSettings />);
    await user.click(screen.getByRole('button', { name: 'Appearance & language' }));
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('is fully translated in Arabic', async () => {
    const user = userEvent.setup();
    renderWithI18n(<AppearanceSettings />, 'ar');
    await user.click(screen.getByRole('button', { name: 'المظهر واللغة' }));
    expect(screen.getByRole('group', { name: 'السمة' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'داكن' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'العربية' })).toBeChecked();
  });
});
