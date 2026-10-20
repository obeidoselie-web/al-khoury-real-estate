import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ListingCard } from '@/components/ListingCard';
import { cardFacts } from '@/lib/facts';
import { formatArea, formatPrice } from '@/lib/format';

import { summary } from './fixtures';

describe('ListingCard', () => {
  it('renders title link, deal badge, price and facts', () => {
    const listing = summary('apartment', 'rent', { id: 'loft-1', title: 'Loft in Gemmayzeh', price: 1900, bedrooms: 1 });
    render(<ListingCard listing={listing} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Loft in Gemmayzeh' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loft in Gemmayzeh' })).toHaveAttribute('href', '/listings/loft-1');
    expect(screen.getByText('For rent', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText('$1,900 / month')).toBeInTheDocument();
    expect(screen.getByText('For rent, $1,900 per month')).toHaveClass('sr-only');
    expect(screen.getByRole('list', { name: 'Key facts' })).toHaveTextContent('1 bed');
  });

  it('treats the card image as decorative (the title already names it)', () => {
    const { container } = render(<ListingCard listing={summary('house', 'sale')} />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

describe('formatting helpers', () => {
  it('formats prices for sale and rent', () => {
    expect(formatPrice(1250000, 'sale')).toBe('$1,250,000');
    expect(formatPrice(850, 'rent')).toBe('$850 / month');
  });

  it('formats areas', () => {
    expect(formatArea(20000)).toBe('20,000 m²');
  });

  it('builds card facts per property type', () => {
    expect(cardFacts({ type: 'apartment', bedrooms: 0, bathrooms: 1, areaSqm: 48 })).toEqual(['Studio', '1 bath', '48 m²']);
    expect(cardFacts({ type: 'house', bedrooms: 3, bathrooms: 2, areaSqm: 210 })).toEqual(['3 beds', '2 baths', '210 m²']);
    expect(cardFacts({ type: 'land', areaSqm: 2400 })).toEqual(['2,400 m²']);
  });
});
