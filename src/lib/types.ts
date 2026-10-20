export const PROPERTY_TYPES = ['house', 'apartment', 'commercial', 'land'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const DEAL_TYPES = ['sale', 'rent'] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export interface ListingImage {
  /** Path under /public or an absolute URL on a host allowed in next.config.ts. */
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Listing {
  /** URL-safe, stable identifier used in /listings/[id]. */
  id: string;
  title: string;
  type: PropertyType;
  deal: DealType;
  /** Asking price in USD. For rentals this is the monthly rent. */
  price: number;
  location: {
    area: string;
    city: string;
  };
  /** Omitted for land and most commercial units. */
  bedrooms?: number;
  bathrooms?: number;
  /** Built-up area in square metres (plot size for land). */
  areaSqm: number;
  plotSqm?: number;
  yearBuilt?: number;
  summary: string;
  description: string[];
  features: string[];
  images: ListingImage[];
  featured?: boolean;
  /** ISO 8601 date. */
  listedAt: string;
}

/** The subset of a listing needed to render a card — keeps client payloads small. */
export type ListingSummary = Pick<
  Listing,
  'id' | 'title' | 'type' | 'deal' | 'price' | 'location' | 'bedrooms' | 'bathrooms' | 'areaSqm'
> & { image: ListingImage };

export function toSummary(listing: Listing): ListingSummary {
  const { id, title, type, deal, price, location, bedrooms, bathrooms, areaSqm, images } = listing;
  return { id, title, type, deal, price, location, bedrooms, bathrooms, areaSqm, image: images[0] };
}
