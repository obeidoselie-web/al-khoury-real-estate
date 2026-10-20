import type { DealType, ListingSummary, PropertyType } from '@/lib/types';

let counter = 0;

export function summary(type: PropertyType, deal: DealType, overrides: Partial<ListingSummary> = {}): ListingSummary {
  counter += 1;
  return {
    id: `${type}-${deal}-${counter}`,
    title: `Test ${type} ${deal} ${counter}`,
    type,
    deal,
    price: deal === 'rent' ? 1500 : 450000,
    location: { area: 'Achrafieh', city: 'Beirut' },
    bedrooms: type === 'land' || type === 'commercial' ? undefined : 2,
    bathrooms: type === 'land' ? undefined : 1,
    areaSqm: 120,
    image: { src: '/images/photos/villa-dusk.jpg', alt: '', width: 1600, height: 1067 },
    ...overrides,
  };
}

/** 2 houses (sale, rent), 3 apartments (sale, rent, rent), 1 commercial (rent), 1 land (sale). */
export function sampleListings(): ListingSummary[] {
  return [
    summary('house', 'sale'),
    summary('house', 'rent'),
    summary('apartment', 'sale'),
    summary('apartment', 'rent'),
    summary('apartment', 'rent'),
    summary('commercial', 'rent'),
    summary('land', 'sale'),
  ];
}
