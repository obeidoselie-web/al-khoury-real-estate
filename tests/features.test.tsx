import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FiltersDialog } from '@/components/FiltersDialog';
import { PaymentCalculator } from '@/components/PaymentCalculator';
import { PropertyGallery } from '@/components/PropertyGallery';
import { ViewingForm } from '@/components/ViewingForm';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { getDictionary } from '@/i18n/dictionaries';
import { advisorForRegion, initials } from '@/lib/data/advisors';
import { DEFAULT_FILTERS, activeRefinements, filterListings, filtersToQueryString, parseFilters, sortListings } from '@/lib/filters';
import { estimateMortgage } from '@/lib/mortgage';
import { validateValuation } from '@/lib/valuation';
import { isoDay, validateViewing, viewingDateRange, type ViewingState } from '@/lib/viewing';

import { sampleListings, summary } from './fixtures';
import { renderWithI18n } from './render';

const en = getDictionary('en');

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe('mortgage estimate', () => {
  it('uses the standard amortisation formula', () => {
    const { loan, monthly, totalInterest } = estimateMortgage(500_000, 30, 20, 7.5);
    expect(loan).toBe(350_000);
    expect(monthly).toBeCloseTo(2819.58, 1);
    expect(totalInterest).toBeCloseTo(monthly * 240 - 350_000, 6);
  });

  it('handles zero interest and a full down payment', () => {
    expect(estimateMortgage(120_000, 0, 10, 0).monthly).toBe(1000);
    expect(estimateMortgage(120_000, 100, 10, 7).monthly).toBe(0);
  });
});

describe('search refinements and sorting', () => {
  const listings = [
    summary('house', 'sale', { price: 900_000, bedrooms: 4, areaSqm: 400 }),
    summary('apartment', 'sale', { price: 400_000, bedrooms: 2, areaSqm: 150 }),
    summary('apartment', 'rent', { price: 1_500, bedrooms: 1, areaSqm: 80 }),
    summary('land', 'sale', { price: 250_000, bedrooms: undefined, bathrooms: undefined, areaSqm: 3000 }),
  ];

  it('parses, serialises and validates the new URL parameters', () => {
    const filters = parseFilters({ deal: 'sale', maxPrice: '500000', minBeds: '2', minSize: '100', sort: 'price-desc' });
    expect(filters).toMatchObject({ maxPrice: 500_000, minBeds: 2, minSize: 100, sort: 'price-desc' });
    expect(filtersToQueryString(filters)).toBe('deal=sale&maxPrice=500000&minBeds=2&minSize=100&sort=price-desc');
    expect(parseFilters({ maxPrice: '-5', minBeds: 'lots', minSize: '1e9', sort: 'random' })).toEqual(DEFAULT_FILTERS);
    expect(parseFilters({ minBeds: '0' }).minBeds).toBe(0);
  });

  it('applies budget only once Buy or Rent is chosen', () => {
    expect(filterListings(listings, { ...DEFAULT_FILTERS, maxPrice: 500_000 })).toHaveLength(4);
    expect(filterListings(listings, { ...DEFAULT_FILTERS, deal: 'sale', maxPrice: 500_000 })).toHaveLength(2);
  });

  it('filters by minimum bedrooms (dropping listings without bedrooms) and size', () => {
    expect(filterListings(listings, { ...DEFAULT_FILTERS, minBeds: 2 }).map((l) => l.type)).toEqual(['house', 'apartment']);
    expect(filterListings(listings, { ...DEFAULT_FILTERS, minSize: 300 })).toHaveLength(2);
  });

  it('counts active refinements and sorts without mutating', () => {
    expect(activeRefinements({ ...DEFAULT_FILTERS, maxPrice: 1, minBeds: 0 })).toBe(1);
    expect(activeRefinements({ ...DEFAULT_FILTERS, deal: 'rent', maxPrice: 1, minSize: 10 })).toBe(2);
    expect(sortListings(listings, 'price-asc').map((l) => l.price)).toEqual([1_500, 250_000, 400_000, 900_000]);
    expect(sortListings(listings, 'size-desc')[0].type).toBe('land');
    expect(sortListings(listings).map((l) => l.id)).toEqual(listings.map((l) => l.id));
  });
});

describe('viewing requests', () => {
  const today = new Date(2026, 9, 20);
  const valid = { name: 'Rania', phone: '+961 3 123 456', date: '2026-10-25', time: 'morning', propertyId: 'studio-hamra' };

  it('accepts a request inside the booking window', () => {
    const result = validateViewing(form(valid), en.property.viewing.errors, today);
    expect(result.ok && result.data).toMatchObject({ time: 'morning', propertyId: 'studio-hamra' });
  });

  it('rejects past, same-day and far-future dates, bad phones and unknown time slots', () => {
    const range = viewingDateRange(today);
    expect(range).toEqual({ min: '2026-10-21', max: '2026-12-19' });
    for (const date of [isoDay(today), '2026-10-01', '2027-03-01', 'soon']) {
      const result = validateViewing(form({ ...valid, date }), en.property.viewing.errors, today);
      expect(result.ok, date).toBe(false);
    }
    const result = validateViewing(form({ ...valid, phone: 'call me', time: 'midnight' }), en.property.viewing.errors, today);
    expect(!result.ok && Object.keys(result.fieldErrors).sort()).toEqual(['phone', 'time']);
  });

  it('drops a tampered property id instead of trusting it', () => {
    const result = validateViewing(form({ ...valid, propertyId: '../x' }), en.property.viewing.errors, today);
    expect(result.ok && result.data.propertyId).toBe('');
  });

  it('shows server errors inline and confirms success in place', async () => {
    const user = userEvent.setup();
    const action = vi
      .fn<(state: ViewingState, data: FormData) => Promise<ViewingState>>()
      .mockResolvedValueOnce({
        status: 'error',
        message: 'Please check the highlighted fields.',
        fieldErrors: { phone: 'Please enter a phone number we can call.' },
        values: { name: 'Rania', phone: 'x', date: '', time: '', notes: '' },
      })
      .mockResolvedValueOnce({ status: 'success', message: 'Thanks!' });
    renderWithI18n(<ViewingForm propertyId="studio-hamra" action={action} />);

    expect(screen.getByLabelText('Preferred date')).toHaveAttribute('min');
    expect(screen.getByRole('group', { name: 'Preferred time' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request viewing' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please check the highlighted fields.');
    expect(screen.getByLabelText('Phone or WhatsApp')).toHaveFocus();
    expect(action.mock.calls[0][1].get('propertyId')).toBe('studio-hamra');

    await user.click(screen.getByRole('button', { name: 'Request viewing' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Viewing requested.');
  });
});

describe('owner valuation requests', () => {
  const valid = { intent: 'sell', type: 'house', region: 'metn', size: '2,400', name: 'Georges', phone: '03 123 456' };

  it('accepts a complete request and normalises the size', () => {
    const result = validateValuation(form(valid), en.sell.errors);
    expect(result.ok && result.data).toMatchObject({ intent: 'sell', type: 'house', region: 'metn', sizeSqm: 2400, email: '' });
  });

  it('reports each invalid field', () => {
    const result = validateValuation(
      form({ intent: 'swap', type: 'castle', region: 'mars', size: 'big', name: 'G', phone: '?', email: 'nope' }),
      en.sell.errors,
    );
    expect(!result.ok && Object.keys(result.fieldErrors).sort()).toEqual(['email', 'intent', 'name', 'phone', 'region', 'size', 'type']);
  });
});

describe('advisors', () => {
  it('assigns an advisor by region and derives initials', () => {
    expect(advisorForRegion('beirut').id).toBe('nadine');
    expect(advisorForRegion('koura').id).toBe('maya');
    expect(initials('Karim Haddad')).toBe('KH');
    expect(initials('مايا سعد')).toBe('مس');
  });
});

describe('photo viewer', () => {
  const images = ['a', 'b', 'c'].map((n) => ({ src: `/images/photos/${n}.jpg`, alt: `Photo ${n}`, width: 1600, height: 1067 }));

  it('opens on the chosen photo and steps through with buttons and arrow keys', async () => {
    const user = userEvent.setup();
    renderWithI18n(<PropertyGallery images={images} title="Villa" locale="en" t={en} />);
    await user.click(screen.getByRole('button', { name: 'Open photo 2 of 3' }));

    const viewer = screen.getByRole('dialog', { name: 'Photo viewer: Villa' });
    expect(within(viewer).getByText('2 / 3')).toBeInTheDocument();
    expect(within(viewer).getByRole('img', { name: 'Photo b' })).toBeInTheDocument();

    await user.click(within(viewer).getByRole('button', { name: 'Next photo' }));
    expect(within(viewer).getByText('3 / 3')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(within(viewer).getByText('1 / 3')).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(within(viewer).getByText('3 / 3')).toBeInTheDocument();

    await user.click(within(viewer).getByRole('button', { name: 'Close photo viewer' }));
    expect(viewer).not.toHaveAttribute('open');
  });

  it('also opens from "Show all photos"', async () => {
    const user = userEvent.setup();
    renderWithI18n(<PropertyGallery images={images} title="Villa" locale="en" t={en} />);
    await user.click(screen.getByRole('button', { name: 'Show all photos' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});

describe('payment calculator', () => {
  it('recalculates when the term changes', async () => {
    const user = userEvent.setup();
    renderWithI18n(<PaymentCalculator price={500_000} />);
    expect(screen.getByText('$2,820')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '30 years' }));
    expect(screen.getByText('$2,447')).toBeInTheDocument();
    expect(screen.getByLabelText('Down payment')).toHaveValue('30');
  });
});

describe('filters panel', () => {
  it('drafts changes, previews the count, and applies them', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithI18n(<FiltersDialog listings={sampleListings()} filters={{ ...DEFAULT_FILTERS, deal: 'sale' }} onApply={onApply} />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(dialog).getByRole('group', { name: 'Budget' })).toBeEnabled();
    expect(within(dialog).getByRole('button', { name: 'Show 3 properties' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: '2+' }));
    expect(within(dialog).getByRole('button', { name: 'Show 2 properties' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Show 2 properties' }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ deal: 'sale', minBeds: 2 }));
  });

  it('asks for Buy or Rent before showing the budget scale, and shows the active count', async () => {
    const user = userEvent.setup();
    renderWithI18n(<FiltersDialog listings={sampleListings()} filters={{ ...DEFAULT_FILTERS, minSize: 100 }} onApply={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Filters, 1 filter applied' }));
    const budget = screen.getByRole('group', { name: 'Budget' });
    expect(within(budget).getByText('Choose Buy or Rent first to set a budget.')).toBeInTheDocument();
    expect(within(budget).queryByRole('slider')).toBeNull();

    await user.click(within(budget).getByRole('radio', { name: 'Buy' }));
    expect(within(budget).getByRole('slider', { name: 'Minimum price' })).toBeInTheDocument();
    expect(within(budget).getByRole('slider', { name: 'Maximum price' })).toHaveAttribute('aria-valuetext', '$5M+');
  });
});

describe('floating WhatsApp button', () => {
  it('links to WhatsApp with a greeting, outside property pages', () => {
    renderWithI18n(<WhatsAppFab />);
    const link = screen.getByRole('link', { name: 'Chat with us on WhatsApp' });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\d+\?text=Hello/);
  });
});
