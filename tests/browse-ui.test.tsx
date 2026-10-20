import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategoryTabs } from '@/components/CategoryTabs';
import { RowScroller } from '@/components/RowScroller';
import { SearchCapsule } from '@/components/SearchCapsule';
import { getDictionary } from '@/i18n/dictionaries';
import { parseFilters } from '@/lib/filters';

const en = getDictionary('en');
const ar = getDictionary('ar');

describe('SearchCapsule', () => {
  it('is a labelled GET search form to the localised listings page', () => {
    render(<SearchCapsule locale="en" t={en} />);
    const form = screen.getByRole('search', { name: 'Search properties' });
    expect(form).toHaveAttribute('action', '/en/listings');
    expect(form).toHaveAttribute('method', 'get');
    expect(within(form).getByRole('button', { name: 'Search' })).toHaveAttribute('type', 'submit');
  });

  it('offers deal and type choices whose values match the listings URL contract', async () => {
    const user = userEvent.setup();
    render(<SearchCapsule locale="en" t={en} />);
    const deal = screen.getByLabelText('Looking to');
    const type = screen.getByLabelText('Property type');

    await user.selectOptions(deal, 'Rent');
    await user.selectOptions(type, 'Apartments');

    const query = new URLSearchParams(new FormData(screen.getByRole('search') as HTMLFormElement) as unknown as string);
    expect(parseFilters(query)).toEqual({ deal: 'rent', type: 'apartment' });
  });

  it('treats the "any" choices as no filter', () => {
    render(<SearchCapsule locale="en" t={en} />);
    const query = new URLSearchParams(new FormData(screen.getByRole('search') as HTMLFormElement) as unknown as string);
    expect(query.toString()).toBe('deal=&type=');
    expect(parseFilters(query)).toEqual({ deal: 'all', type: 'all' });
  });

  it('is translated and targets the Arabic listings page', () => {
    render(<SearchCapsule locale="ar" t={ar} />);
    expect(screen.getByRole('search', { name: 'ابحث عن عقار' })).toHaveAttribute('action', '/ar/listings');
    expect(screen.getByLabelText('نوع العقار')).toBeInTheDocument();
  });
});

describe('CategoryTabs', () => {
  const options = [
    { value: 'all' as const, label: 'All types', count: 4, countLabel: '4 listings' },
    { value: 'house' as const, label: 'Houses', count: 0, countLabel: '0 listings' },
  ];

  it('renders a labelled radio group with icons and accessible counts', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<CategoryTabs name="type" legend="Property type" options={options} value="all" onChange={onChange} />);

    expect(screen.getByRole('group', { name: 'Property type' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'All types, 4 listings' })).toBeChecked();
    expect(container.querySelectorAll('svg')).toHaveLength(2);

    await user.click(screen.getByRole('radio', { name: 'Houses, 0 listings' }));
    expect(onChange).toHaveBeenCalledWith('house');
  });

  it('marks options with no results so they can be shown quieter', () => {
    const { container } = render(<CategoryTabs name="type" legend="Property type" options={options} value="all" onChange={vi.fn()} />);
    const labels = container.querySelectorAll('label');
    expect(labels[0]).not.toHaveAttribute('data-empty');
    expect(labels[1]).toHaveAttribute('data-empty');
  });
});

describe('RowScroller', () => {
  it('labels the scroll region and arrow buttons, disabling arrows when there is nowhere to scroll', () => {
    render(
      <RowScroller heading={<h2>Houses</h2>} regionLabel="Houses" previousLabel="Previous: Houses" nextLabel="Next: Houses">
        <ul>
          <li>Card</li>
        </ul>
      </RowScroller>,
    );
    expect(screen.getByRole('region', { name: 'Houses' })).toHaveAttribute('tabindex', '0');
    // jsdom has no layout, so the row doesn't overflow: both arrows start disabled.
    expect(screen.getByRole('button', { name: 'Previous: Houses' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next: Houses' })).toBeDisabled();
  });
});
