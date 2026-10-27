import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ListingsExplorer } from '@/components/ListingsExplorer';
import { inBox, pinLabel, spreadPins } from '@/components/MapSearch';
import { recordToRows, placeholderPin } from '@/lib/data/mappers';
import { PLACEHOLDER_LISTINGS } from '@/lib/data/placeholder-listings';
import { DEFAULT_FILTERS } from '@/lib/filters';

import { sampleListings } from './fixtures';
import { renderWithI18n } from './render';

afterEach(() => localStorage.clear());

describe('map search helpers', () => {
  it('labels pins with a short price, and none for price on request', () => {
    expect(pinLabel({ price: 780_000 })).toBe('$780K');
    expect(pinLabel({ price: 1_250_000 })).toBe('$1.3M');
    expect(pinLabel({ price: 0, priceOnRequest: true })).toBe('•');
  });

  it('checks whether a pin is inside the visible map', () => {
    const box = { south: 33.8, west: 35.4, north: 34, east: 35.6 };
    expect(inBox({ lat: 33.9, lng: 35.5 }, box)).toBe(true);
    expect(inBox({ lat: 34.25, lng: 35.65 }, box)).toBe(false);
  });

  it('fans out pins that share a spot so each stays clickable', () => {
    const spot = { lat: 33.89, lng: 35.52, exact: false };
    const out = spreadPins([
      { id: 'a', map: spot },
      { id: 'b', map: spot },
      { id: 'c', map: { lat: 34.25, lng: 35.66, exact: false } },
      { id: 'd' },
    ]);
    expect(out.size).toBe(3);
    expect(out.get('a')).not.toEqual(out.get('b'));
    expect(out.get('c')).toEqual({ lat: 34.25, lng: 35.66 });
  });

  it('seeds every placeholder listing with its neighbourhood as an approximate pin', () => {
    for (const record of PLACEHOLDER_LISTINGS) {
      const pin = placeholderPin(record);
      expect(pin.mapMode, record.id).toBe('approximate');
      expect(recordToRows(record, null).listing).toMatchObject({ lat: pin.lat, lng: pin.lng, mapMode: 'approximate' });
    }
  });
});

describe('Map view on the Properties page', () => {
  const pinned = () =>
    sampleListings().map((listing, i) => ({ ...listing, map: { lat: 33.88 + i * 0.01, lng: 35.5, exact: false } }));

  it('offers Map only when some property has a location', () => {
    renderWithI18n(<ListingsExplorer listings={sampleListings()} initialFilters={DEFAULT_FILTERS} />);
    expect(screen.queryByRole('button', { name: 'Map' })).toBeNull();
  });

  it('switches to the map view, with the results beside it', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ListingsExplorer listings={pinned()} initialFilters={DEFAULT_FILTERS} />);
    await user.click(screen.getByRole('button', { name: 'Map' }));
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('region', { name: 'Map of matching properties' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Search as I move the map' })).toBeChecked();
    expect(localStorage.getItem('ak-listing-view')).toBe('map');
  });
});

describe('pin clustering', () => {
  it('groups pins closer than the radius and keeps distant ones apart', async () => {
    const { clusterPoints } = await import('@/components/MapSearch');
    const groups = clusterPoints(
      [
        { id: 'a', x: 100, y: 100 },
        { id: 'b', x: 120, y: 110 },
        { id: 'c', x: 400, y: 300 },
      ],
      44,
    );
    expect(groups.map((g) => g.members.map((m) => m.id))).toEqual([['a', 'b'], ['c']]);
  });
});
