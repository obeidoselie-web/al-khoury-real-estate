import { localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

import { SOCIAL_NETWORKS, type SiteSettings } from './site';
import type { Listing } from './types';

/*
 * schema.org data for search engines (JSON-LD). Built from the same settings and listing data as
 * the page, so it never contradicts what visitors see: a hidden price is not published here either.
 */

type JsonLd = Record<string, unknown>;

/** The agency: name, contact, office address and location, social profiles. */
export function agencyJsonLd(site: SiteSettings, t: Dictionary, locale: Locale, origin: string): JsonLd {
  const sameAs = SOCIAL_NETWORKS.map((n) => site.social[n]).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${origin}/#agency`,
    name: t.company.name,
    description: t.company.tagline,
    url: `${origin}${localizedPath(locale)}`,
    logo: `${origin}/brand/icon-512.png`,
    image: site.hero.image.src.startsWith('http') ? site.hero.image.src : `${origin}${site.hero.image.src}`,
    telephone: site.contact.phone,
    email: site.contact.email,
    foundingDate: String(site.contact.founded),
    address: {
      '@type': 'PostalAddress',
      streetAddress: t.company.address[0],
      addressLocality: t.company.address[1],
      addressCountry: 'LB',
    },
    ...(site.office.showMap && {
      geo: { '@type': 'GeoCoordinates', latitude: site.office.lat, longitude: site.office.lng },
    }),
    areaServed: { '@type': 'Country', name: 'Lebanon' },
    ...(sameAs.length > 0 && { sameAs }),
    inLanguage: locale,
  };
}

const ACCOMMODATION: Record<Listing['type'], string> = {
  house: 'SingleFamilyResidence',
  apartment: 'Apartment',
  commercial: 'Place',
  // schema.org has no land type; Place is the closest.
  land: 'Place',
};

/** One property: what it is, where, photos, and the offer (only when the price is published). */
export function listingJsonLd(listing: Listing, t: Dictionary, locale: Locale, origin: string): JsonLd {
  const url = `${origin}${localizedPath(locale, `/listings/${listing.id}`)}`;
  const absolute = (src: string) => (src.startsWith('http') ? src : `${origin}${src}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': url,
    url,
    name: listing.title,
    description: listing.summary,
    inLanguage: locale,
    ...(!listing.display?.hideListedDate && { datePosted: listing.listedAt }),
    image: listing.images.slice(0, 6).map((image) => absolute(image.src)),
    provider: { '@id': `${origin}/#agency` },
    about: {
      '@type': ACCOMMODATION[listing.type],
      name: listing.title,
      address: {
        '@type': 'PostalAddress',
        ...(listing.location.area && { streetAddress: listing.location.area }),
        addressLocality: listing.location.city,
        addressCountry: 'LB',
      },
      ...(listing.areaSqm !== undefined && {
        floorSize: { '@type': 'QuantitativeValue', value: listing.areaSqm, unitCode: 'MTK' },
      }),
      ...(listing.bedrooms !== undefined && { numberOfBedrooms: listing.bedrooms }),
      ...(listing.bathrooms !== undefined && { numberOfBathroomsTotal: listing.bathrooms }),
      ...(listing.yearBuilt !== undefined && { yearBuilt: listing.yearBuilt }),
      ...(listing.map?.exact && {
        geo: { '@type': 'GeoCoordinates', latitude: listing.map.lat, longitude: listing.map.lng },
      }),
    },
    ...(!listing.priceOnRequest && {
      offers: {
        '@type': 'Offer',
        price: listing.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        businessFunction: listing.deal === 'rent' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
        ...(listing.deal === 'rent' && {
          priceSpecification: { '@type': 'UnitPriceSpecification', price: listing.price, priceCurrency: 'USD', unitCode: 'MON' },
        }),
      },
    }),
    keywords: [t.types[listing.type].label, t.deals[listing.deal].badge, listing.location.city].join(', '),
  };
}

/** Breadcrumbs as shown on the property page. */
export function breadcrumbJsonLd(items: { name: string; path: string }[], origin: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}

/** Safe to inline in a <script> tag: "<" is escaped so the data can't close the tag. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
