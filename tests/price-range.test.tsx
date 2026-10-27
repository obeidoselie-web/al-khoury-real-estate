import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FiltersDialog } from '@/components/FiltersDialog';
import { PriceRange, median, priceHistogram, stepIndex } from '@/components/PriceRange';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_FILTERS, PRICE_STEPS, filterListings, filtersToQueryString, parseAmount, parseFilters } from '@/lib/filters';

import { sampleListings } from './fixtures';
import { renderWithI18n } from './render';

const en = getDictionary('en');

describe('budget model', () => {
  it('reads shorthand amounts, including Arabic digits', () => {
    expect(parseAmount('750k')).toBe(750_000);
    expect(parseAmount('1.2m')).toBe(1_200_000);
    expect(parseAmount('$1,250,000')).toBe(1_250_000);
    expect(parseAmount('٥٠٠k')).toBe(500_000);
    expect(parseAmount('abc')).toBeUndefined();
    expect(parseAmount('0')).toBeUndefined();
  });

  it('keeps min and max in the URL, and ignores a max below the min', () => {
    const filters = { ...DEFAULT_FILTERS, deal: 'sale' as const, minPrice: 300_000, maxPrice: 900_000 };
    expect(parseFilters(new URLSearchParams(filtersToQueryString(filters)))).toEqual(filters);
    expect(parseFilters({ deal: 'sale', minPrice: '900000', maxPrice: '300000' })).toEqual({
      ...DEFAULT_FILTERS,
      deal: 'sale',
      minPrice: 900_000,
    });
  });

  it('filters by the range once a deal is chosen', () => {
    const base = { type: 'house' as const, deal: 'sale' as const, region: 'beirut' as const, areaSqm: 100 };
    const items = [
      { ...base, id: 'a', price: 200_000 },
      { ...base, id: 'b', price: 600_000 },
      { ...base, id: 'c', price: 1_500_000 },
    ];
    const ids = (minPrice?: number, maxPrice?: number, deal: 'sale' | 'all' = 'sale') =>
      filterListings(items, { ...DEFAULT_FILTERS, deal, minPrice, maxPrice }).map((l) => l.id);
    expect(ids(500_000)).toEqual(['b', 'c']);
    expect(ids(undefined, 700_000)).toEqual(['a', 'b']);
    expect(ids(300_000, 1_000_000)).toEqual(['b']);
    expect(ids(500_000, undefined, 'all')).toEqual(['a', 'b', 'c']); // no budget without a deal
  });

  it('places prices on the stepped scale', () => {
    const steps = PRICE_STEPS.sale;
    expect(stepIndex(steps, 0, 0)).toBe(0);
    expect(stepIndex(steps, 275_000, 0)).toBe(steps.indexOf(250_000));
    expect(stepIndex(steps, 9_000_000, 0)).toBe(steps.length - 1);
    const bins = priceHistogram(steps, [60_000, 70_000, 9_000_000]);
    expect(bins).toHaveLength(steps.length - 1);
    expect(bins[1]).toBe(2);
    expect(bins.at(-1)).toBe(1); // above the top stop counts in the last bar
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(3);
    expect(median([])).toBeUndefined();
  });
});

describe('price range control', () => {
  function renderRange(props: { min?: number; max?: number } = {}) {
    const onChange = vi.fn();
    renderWithI18n(<PriceRange deal="sale" prices={[400_000, 600_000, 800_000]} onChange={onChange} locale="en" t={en} {...props} />);
    return onChange;
  }

  it('describes both handles in words and shows the typical price', () => {
    renderRange({ min: 300_000 });
    expect(screen.getByRole('slider', { name: 'Minimum price' })).toHaveAttribute('aria-valuetext', '$300K');
    expect(screen.getByRole('slider', { name: 'Maximum price' })).toHaveAttribute('aria-valuetext', '$5M+');
    expect(screen.getByText(/Typical price: \$600,000/)).toBeInTheDocument();
  });

  it('moves along the stepped scale and never lets the handles cross', () => {
    const onChange = renderRange({ min: 300_000, max: 400_000 });
    const minHandle = screen.getByRole('slider', { name: 'Minimum price' });
    fireEvent.change(minHandle, { target: { value: String(PRICE_STEPS.sale.indexOf(250_000)) } });
    expect(onChange).toHaveBeenLastCalledWith({ min: 250_000, max: 400_000 });
    fireEvent.change(minHandle, { target: { value: String(PRICE_STEPS.sale.length - 1) } });
    expect(onChange).toHaveBeenLastCalledWith({ min: 300_000, max: 400_000 }); // stopped one step below max
    fireEvent.change(screen.getByRole('slider', { name: 'Maximum price' }), { target: { value: String(PRICE_STEPS.sale.length - 1) } });
    expect(onChange).toHaveBeenLastCalledWith({ min: 300_000, max: undefined }); // top stop = no maximum
  });

  it('accepts typed amounts and keeps min below max', async () => {
    const user = userEvent.setup();
    const onChange = renderRange({ max: 500_000 });
    await user.type(screen.getByLabelText('Minimum'), '750k{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({ min: 500_000, max: 750_000 });
  });

  it('puts an unreadable entry back', async () => {
    const user = userEvent.setup();
    const onChange = renderRange({ min: 300_000 });
    const field = screen.getByLabelText('Minimum');
    await user.clear(field);
    await user.type(field, 'cheap{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(field).toHaveValue('$300,000');
  });
});

describe('budget in the Filters panel', () => {
  it('applies a typed range and previews the result count', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithI18n(<FiltersDialog listings={sampleListings()} filters={{ ...DEFAULT_FILTERS, deal: 'sale' }} onApply={onApply} />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    await user.type(within(dialog).getByLabelText('Maximum'), '1m{Enter}');
    const apply = within(dialog).getByRole('button', { name: /^Show \d+ propert/ });
    await user.click(apply);
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ deal: 'sale', maxPrice: 1_000_000 }));
  });
});
