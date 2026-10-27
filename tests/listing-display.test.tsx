import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ListingCard } from '@/components/ListingCard';
import { ListingsExplorer } from '@/components/ListingsExplorer';
import { getDictionary } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';
import { parseSettings } from '@/lib/admin/website-form';
import { DEFAULT_FILTERS } from '@/lib/filters';
import { DEFAULT_SITE, publicContact, resolveSite, type ListingDisplaySettings } from '@/lib/site';

import { sampleListings } from './fixtures';

const en = getDictionary('en');

function renderExplorer(listings: Partial<ListingDisplaySettings> = {}) {
  const site = { ...DEFAULT_SITE, listings: { ...DEFAULT_SITE.listings, ...listings } };
  return render(
    <I18nProvider locale="en" dictionary={en} contact={publicContact(site)}>
      <ListingsExplorer listings={sampleListings()} initialFilters={DEFAULT_FILTERS} />
    </I18nProvider>,
  );
}

afterEach(() => window.localStorage.clear());

describe('listing display settings', () => {
  it('keeps stored values in range and falls back for unknown choices', () => {
    const site = resolveSite({ listings: { columns: 9, defaultView: 'carousel', photoShape: 'portrait', showFacts: false } });
    expect(site.listings).toMatchObject({ columns: 5, defaultView: 'grid', photoShape: 'portrait', showFacts: false, showBadge: true });
    expect(resolveSite({ listings: { columns: 1 } }).listings.columns).toBe(2);
  });

  it('validates the admin form: choices and 2–5 columns', () => {
    const form = new FormData();
    form.set('__settings', 'listings.defaultView,listings.photoShape,listings.columns,listings.showBadge');
    form.set('s.listings.defaultView', 'list');
    form.set('s.listings.photoShape', 'landscape');
    form.set('s.listings.columns', '3');
    const ok = parseSettings(form, DEFAULT_SITE);
    expect(ok.errors).toEqual({});
    expect(ok.settings.listings).toMatchObject({ defaultView: 'list', photoShape: 'landscape', columns: 3, showBadge: false });

    form.set('s.listings.defaultView', 'mosaic');
    form.set('s.listings.columns', '7');
    expect(Object.keys(parseSettings(form, DEFAULT_SITE).errors).sort()).toEqual(['s.listings.columns', 's.listings.defaultView']);
  });
});

describe('property cards', () => {
  const listing = { ...sampleListings()[0] };

  it('shows badge, heart, type, location and facts by default', () => {
    render(<ListingCard listing={listing} locale="en" t={en} />);
    const card = screen.getByRole('article');
    expect(within(card).getByText(en.deals[listing.deal].badge)).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(within(card).getByRole('list', { name: en.card.keyFacts })).toBeInTheDocument();
  });

  it('leaves out what the settings turn off, but always keeps title and price', () => {
    render(
      <ListingCard
        listing={listing}
        locale="en"
        t={en}
        options={{ ...DEFAULT_SITE.listings, showBadge: false, showFavourite: false, showFacts: false, showType: false, showLocation: false }}
      />,
    );
    const card = screen.getByRole('article');
    expect(within(card).queryByText(en.deals[listing.deal].badge, { selector: '.badge' })).toBeNull();
    expect(within(card).queryByRole('button')).toBeNull();
    expect(within(card).queryByRole('list')).toBeNull();
    expect(within(card).getByRole('link', { name: listing.title })).toBeInTheDocument();
    expect(card.textContent).toContain('$');
  });
});

describe('grid and list views on the Properties page', () => {
  const results = () => screen.getByRole('list', { name: 'Matching properties' });

  it('opens in the default view and lets visitors switch, remembering the choice', async () => {
    const user = userEvent.setup();
    const { unmount } = renderExplorer({ columns: 3 });
    expect(results().className).toMatch(/grid/);
    expect(results().style.getPropertyValue('--cols')).toBe('3');

    await user.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    expect(results().className).toMatch(/list/);
    expect(window.localStorage.getItem('ak-listing-view')).toBe('list');

    unmount();
    renderExplorer();
    expect(results().className).toMatch(/list/); // restored on this device
  });

  it('uses the admin default and hides the switch when switching is off', () => {
    window.localStorage.setItem('ak-listing-view', 'grid');
    renderExplorer({ defaultView: 'list', allowViewSwitch: false });
    expect(results().className).toMatch(/list/);
    expect(screen.queryByRole('group', { name: 'View' })).toBeNull();
  });
});
