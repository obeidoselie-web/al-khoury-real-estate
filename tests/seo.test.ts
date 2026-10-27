// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getDictionary } from '@/i18n/dictionaries';
import { placeholderListingsSource } from '@/lib/data/listings';
import { DEFAULT_SITE } from '@/lib/site';
import { agencyJsonLd, breadcrumbJsonLd, listingJsonLd, serializeJsonLd } from '@/lib/structured-data';

const ORIGIN = 'https://alkhoury.example';
const en = getDictionary('en');

describe('structured data', () => {
  it('describes the agency from the website settings', () => {
    const data = agencyJsonLd(
      { ...DEFAULT_SITE, social: { ...DEFAULT_SITE.social, instagram: 'https://instagram.com/alkhoury' } },
      en,
      'en',
      ORIGIN,
    );
    expect(data).toMatchObject({
      '@type': 'RealEstateAgent',
      name: en.company.name,
      telephone: DEFAULT_SITE.contact.phone,
      url: `${ORIGIN}/en`,
      sameAs: ['https://instagram.com/alkhoury'],
      geo: { latitude: DEFAULT_SITE.office.lat, longitude: DEFAULT_SITE.office.lng },
    });
    expect(agencyJsonLd({ ...DEFAULT_SITE, office: { ...DEFAULT_SITE.office, showMap: false } }, en, 'en', ORIGIN).geo).toBeUndefined();
  });

  it('describes a listing with absolute URLs, and publishes the price only when it is shown', async () => {
    const listing = (await placeholderListingsSource.getById('villa-broummana-pine-view', 'en'))!;
    const data = listingJsonLd(listing, en, 'en', ORIGIN);
    expect(data).toMatchObject({
      '@type': 'RealEstateListing',
      url: `${ORIGIN}/en/listings/villa-broummana-pine-view`,
      offers: { price: listing.price, priceCurrency: 'USD' },
      about: { '@type': 'SingleFamilyResidence', numberOfBedrooms: listing.bedrooms },
    });
    expect((data.image as string[]).every((src) => src.startsWith(ORIGIN))).toBe(true);

    const onRequest = listingJsonLd({ ...listing, price: 0, priceOnRequest: true }, en, 'en', ORIGIN);
    expect(onRequest.offers).toBeUndefined();
    // An approximate pin is never published as coordinates.
    const approx = listingJsonLd({ ...listing, map: { lat: 33.9, lng: 35.6, exact: false } }, en, 'en', ORIGIN);
    expect((approx.about as Record<string, unknown>).geo).toBeUndefined();
  });

  it('builds breadcrumbs and serialises safely inside a script tag', () => {
    const crumbs = breadcrumbJsonLd([{ name: 'Properties', path: '/en/listings' }], ORIGIN);
    expect(crumbs.itemListElement).toEqual([{ '@type': 'ListItem', position: 1, name: 'Properties', item: `${ORIGIN}/en/listings` }]);
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>');
  });
});
