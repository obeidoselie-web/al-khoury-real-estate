import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ListingCard } from '@/components/ListingCard';
import { getDictionary } from '@/i18n/dictionaries';
import { cardFacts } from '@/lib/facts';
import { formatArea, formatPlace, formatPrice } from '@/lib/format';

import { summary } from './fixtures';

const en = getDictionary('en');
const ar = getDictionary('ar');

describe('ListingCard', () => {
  it('renders title link, deal badge, price and facts', () => {
    const listing = summary('apartment', 'rent', { id: 'loft-1', title: 'Loft in Gemmayzeh', price: 1900, bedrooms: 1 });
    render(<ListingCard listing={listing} locale="en" t={en} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Loft in Gemmayzeh' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loft in Gemmayzeh' })).toHaveAttribute('href', '/en/listings/loft-1');
    expect(screen.getByText('For rent', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText('$1,900 / month')).toBeInTheDocument();
    expect(screen.getByText('For rent, $1,900 per month')).toHaveClass('sr-only');
    expect(screen.getByRole('list', { name: 'Key facts' })).toHaveTextContent('1 bed');
  });

  it('renders in Arabic with an Arabic link, badge and facts', () => {
    const listing = summary('house', 'sale', { id: 'villa-1', title: 'فيلا', bedrooms: 2, bathrooms: 2 });
    render(<ListingCard listing={listing} locale="ar" t={ar} />);
    expect(screen.getByRole('link', { name: 'فيلا' })).toHaveAttribute('href', '/ar/listings/villa-1');
    expect(screen.getByText('للبيع', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'معلومات أساسية' })).toHaveTextContent('غرفتا نوم');
  });

  it('treats the card image as decorative (the title already names it)', () => {
    const { container } = render(<ListingCard listing={summary('house', 'sale')} locale="en" t={en} />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

describe('formatting helpers', () => {
  it('formats prices for sale and rent in both languages, with Latin digits', () => {
    expect(formatPrice(1250000, 'sale', 'en', en)).toBe('$1,250,000');
    expect(formatPrice(850, 'rent', 'en', en)).toBe('$850 / month');
    // Arabic keeps "$1,250,000" as a left-to-right island so it isn't reordered inside RTL text.
    expect(formatPrice(1250000, 'sale', 'ar', ar)).toBe('⁦$1,250,000⁩');
    expect(formatPrice(850, 'rent', 'ar', ar)).toBe('⁦$850⁩ / شهريًا');
  });

  it('formats areas and places', () => {
    expect(formatArea(20000, 'en', en)).toBe('20,000 m²');
    expect(formatArea(20000, 'ar', ar)).toBe('20,000 م²');
    expect(formatPlace({ area: 'Hamra', city: 'Beirut' }, 'en')).toBe('Hamra, Beirut');
    expect(formatPlace({ area: 'الحمرا', city: 'بيروت' }, 'ar')).toBe('الحمرا، بيروت');
  });

  it('builds card facts per property type', () => {
    expect(cardFacts({ type: 'apartment', bedrooms: 0, bathrooms: 1, areaSqm: 48 }, 'en', en)).toEqual(['Studio', '1 bath', '48 m²']);
    expect(cardFacts({ type: 'house', bedrooms: 3, bathrooms: 2, areaSqm: 210 }, 'en', en)).toEqual(['3 beds', '2 baths', '210 m²']);
    expect(cardFacts({ type: 'land', areaSqm: 2400 }, 'en', en)).toEqual(['2,400 m²']);
    expect(cardFacts({ type: 'house', bedrooms: 5, bathrooms: 1, areaSqm: 420 }, 'ar', ar)).toEqual([
      '5 غرف نوم',
      'حمّام واحد',
      '420 م²',
    ]);
  });
});
