import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FavouriteButton } from '@/components/FavouriteButton';
import { ListingCard } from '@/components/ListingCard';
import { SavedLink } from '@/components/SavedLink';
import { SavedListings } from '@/components/SavedListings';
import { getDictionary } from '@/i18n/dictionaries';
import {
  FAVOURITES_STORAGE_KEY,
  getFavourites,
  isFavourite,
  parseFavourites,
  pruneFavourites,
  resetFavouritesCache,
  subscribeFavourites,
  toggleFavourite,
} from '@/lib/favourites';

import { summary } from './fixtures';
import { renderWithI18n } from './render';

const en = getDictionary('en');
const ar = getDictionary('ar');

beforeEach(() => {
  window.localStorage.clear();
  resetFavouritesCache();
});

afterEach(() => {
  window.localStorage.clear();
  resetFavouritesCache();
});

describe('favourites store', () => {
  it('parses stored ids defensively', () => {
    expect(parseFavourites(null)).toEqual([]);
    expect(parseFavourites('not json')).toEqual([]);
    expect(parseFavourites('{"a":1}')).toEqual([]);
    expect(parseFavourites('["villa-1", "villa-1", 42, "../etc", "loft-2"]')).toEqual(['villa-1', 'loft-2']);
    expect(parseFavourites(JSON.stringify(Array.from({ length: 300 }, (_, i) => `id-${i}`)))).toHaveLength(200);
  });

  it('toggles, persists newest first and notifies subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFavourites(listener);

    expect(toggleFavourite('villa-1')).toBe(true);
    expect(toggleFavourite('loft-2')).toBe(true);
    expect(getFavourites()).toEqual(['loft-2', 'villa-1']);
    expect(JSON.parse(window.localStorage.getItem(FAVOURITES_STORAGE_KEY)!)).toEqual(['loft-2', 'villa-1']);
    expect(listener).toHaveBeenCalledTimes(2);

    expect(toggleFavourite('villa-1')).toBe(false);
    expect(isFavourite('villa-1')).toBe(false);
    expect(toggleFavourite('loft-2')).toBe(false);
    // An empty list leaves nothing behind in storage.
    expect(window.localStorage.getItem(FAVOURITES_STORAGE_KEY)).toBeNull();
    unsubscribe();
  });

  it('ignores malformed ids', () => {
    expect(toggleFavourite('<script>')).toBe(false);
    expect(getFavourites()).toEqual([]);
  });

  it('reads what an earlier visit stored', () => {
    window.localStorage.setItem(FAVOURITES_STORAGE_KEY, '["villa-1"]');
    resetFavouritesCache();
    expect(isFavourite('villa-1')).toBe(true);
  });

  it('keeps working for the page view when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(getFavourites()).toEqual([]);
    expect(toggleFavourite('villa-1')).toBe(true);
    expect(isFavourite('villa-1')).toBe(true);
  });

  it('picks up changes made in another tab', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFavourites(listener);
    window.dispatchEvent(new StorageEvent('storage', { key: FAVOURITES_STORAGE_KEY, newValue: '["loft-2"]' }));
    expect(getFavourites()).toEqual(['loft-2']);
    expect(listener).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new StorageEvent('storage', { key: 'ak-appearance', newValue: '{}' }));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('prunes ids for listings that no longer exist', () => {
    toggleFavourite('gone-1');
    toggleFavourite('villa-1');
    pruneFavourites(['villa-1', 'loft-2']);
    expect(getFavourites()).toEqual(['villa-1']);
  });
});

describe('FavouriteButton', () => {
  it('is a toggle button with a fixed name and aria-pressed state, operable by keyboard', async () => {
    const user = userEvent.setup();
    render(<FavouriteButton id="villa-1" title="Stone villa" t={en} />);
    const button = screen.getByRole('button', { name: 'Save Stone villa' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(isFavourite('villa-1')).toBe(true);

    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps every heart for the same listing in sync', async () => {
    const user = userEvent.setup();
    render(
      <>
        <FavouriteButton id="villa-1" title="Stone villa" t={en} />
        <FavouriteButton id="villa-1" title="Stone villa" t={en} variant="page" />
      </>,
    );
    const [card, page] = screen.getAllByRole('button', { name: 'Save Stone villa' });
    await user.click(page!);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    // The page variant shows its label; the accessible name still includes it.
    expect(page).toHaveTextContent('Save');
  });

  it('reflects a saved state on first render after hydration', () => {
    window.localStorage.setItem(FAVOURITES_STORAGE_KEY, '["villa-1"]');
    render(<FavouriteButton id="villa-1" title="Stone villa" t={en} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('is labelled in Arabic', () => {
    render(<FavouriteButton id="villa-1" title="فيلا" t={ar} />);
    expect(screen.getByRole('button', { name: 'حفظ فيلا' })).toBeInTheDocument();
  });

  it('appears on every listing card without becoming part of the card link', () => {
    render(<ListingCard listing={summary('house', 'sale', { id: 'villa-1', title: 'Stone villa' })} locale="en" t={en} />);
    const heart = screen.getByRole('button', { name: 'Save Stone villa' });
    expect(heart.closest('a')).toBeNull();
  });
});

describe('saved properties UI', () => {
  it('counts saved properties in the header link', async () => {
    renderWithI18n(<SavedLink />);
    const link = screen.getByRole('link', { name: 'Saved' });
    expect(link).toHaveAttribute('href', '/en/saved');

    act(() => {
      toggleFavourite('villa-1');
      toggleFavourite('loft-2');
    });
    expect(screen.getByRole('link', { name: 'Saved, 2 saved properties' })).toBeInTheDocument();
  });

  it('lists saved properties, newest first, and keeps an unsaved card until leaving the page', async () => {
    const user = userEvent.setup();
    const listings = [
      summary('house', 'sale', { id: 'villa-1', title: 'Stone villa' }),
      summary('apartment', 'rent', { id: 'loft-2', title: 'Loft' }),
      summary('land', 'sale', { id: 'plot-3', title: 'Plot' }),
    ];
    toggleFavourite('villa-1');
    toggleFavourite('loft-2');
    renderWithI18n(<SavedListings listings={listings} />);

    const list = screen.getByRole('list', { name: 'Saved properties' });
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(['Loft', 'Stone villa']);
    expect(list).not.toHaveTextContent('Plot');
    expect(screen.getByRole('status')).toHaveTextContent('2 saved properties');

    await user.click(screen.getByRole('button', { name: 'Save Loft' }));
    expect(screen.getByRole('heading', { name: 'Loft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Loft' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('1 saved property');
  });

  it('shows an empty state that links to all properties', () => {
    renderWithI18n(<SavedListings listings={[summary('house', 'sale')]} />);
    expect(screen.getByRole('heading', { name: 'No saved properties yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse properties' })).toHaveAttribute('href', '/en/listings');
  });

  it('drops saved ids whose listing has gone', () => {
    toggleFavourite('gone-1');
    renderWithI18n(<SavedListings listings={[summary('house', 'sale', { id: 'villa-1' })]} />);
    expect(getFavourites()).toEqual([]);
  });

  it('renders the Arabic saved page', () => {
    toggleFavourite('villa-1');
    renderWithI18n(<SavedListings listings={[summary('house', 'sale', { id: 'villa-1', title: 'فيلا' })]} />, 'ar');
    expect(screen.getByRole('list', { name: 'العقارات المحفوظة' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('عقار محفوظ واحد');
  });
});
