import type { ListingDisplay } from './listing-display';

export const PROPERTY_TYPES = ['house', 'apartment', 'commercial', 'land'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const DEAL_TYPES = ['sale', 'rent'] as const;
export type DealType = (typeof DEAL_TYPES)[number];

/** Search regions (Lebanese districts / cities). Labels live in the dictionaries under `regions`. */
export const REGIONS = ['beirut', 'metn', 'keserwan', 'batroun', 'koura', 'bekaa'] as const;
export type Region = (typeof REGIONS)[number];

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
  /** Search region; `location` holds the display names. */
  region: Region;
  /** Asking price in USD. For rentals this is the monthly rent. 0 when priceOnRequest. */
  price: number;
  /** The price is not published ("Price on request"); `price` is then 0. */
  priceOnRequest?: boolean;
  location: {
    area: string;
    city: string;
  };
  /** Omitted for land and most commercial units. */
  bedrooms?: number;
  bathrooms?: number;
  /** Built-up area in square metres (plot size for land). Omitted when hidden. */
  areaSqm?: number;
  plotSqm?: number;
  yearBuilt?: number;
  summary: string;
  description: string[];
  features: string[];
  images: ListingImage[];
  featured?: boolean;
  /** Ownership documents checked by the agency ("Title deed verified" badge). */
  verified?: boolean;
  /** ISO 8601 date. */
  listedAt: string;
  /** Staff member responsible for the listing (shown as the advisor card). */
  advisorId?: string;
  /** Page sections to leave out (Admin → listing → What the website shows). */
  display?: Pick<ListingDisplay, 'hideListedDate' | 'hideFeatures' | 'hideCalculator' | 'hideViewingForm' | 'hideAdvisor' | 'hideSimilar'>;
  /** Map pin; already rounded on the server when the location is approximate. */
  map?: { lat: number; lng: number; exact: boolean };
}

/** The subset of a listing needed to render a card — keeps client payloads small. */
export type ListingSummary = Pick<
  Listing,
  'id' | 'title' | 'type' | 'deal' | 'region' | 'price' | 'priceOnRequest' | 'location' | 'bedrooms' | 'bathrooms' | 'areaSqm' | 'map'
> & { image: ListingImage };

export function toSummary(listing: Listing): ListingSummary {
  const { id, title, type, deal, region, price, priceOnRequest, location, bedrooms, bathrooms, areaSqm, images, map } = listing;
  return {
    id,
    title,
    type,
    deal,
    region,
    price,
    ...(priceOnRequest && { priceOnRequest }),
    location,
    bedrooms,
    bathrooms,
    areaSqm,
    image: images[0],
    ...(map && { map }),
  };
}
