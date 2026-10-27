// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { ListingPhotoRow, ListingRow } from '@/db/schema';
import { getDictionary } from '@/i18n/dictionaries';
import { parseListingForm } from '@/lib/admin/forms';
import { parseSettings, parseTexts } from '@/lib/admin/website-form';
import { applyOverrides, flattenTexts, labelForPath, overrideProblem, placeholders } from '@/lib/content/texts';
import { recordToRows, rowToListing } from '@/lib/data/mappers';
import { PLACEHOLDER_LISTINGS } from '@/lib/data/placeholder-listings';
import { filterListings, parseFilters, sortListings } from '@/lib/filters';
import { listingPrice } from '@/lib/format';
import {
  DEFAULT_SITE,
  approximate,
  isValidPoint,
  osmEmbedUrl,
  parseMapLink,
  resolveSite,
  telHref,
  whatsappHref,
} from '@/lib/site';

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) for (const v of [value].flat()) data.append(key, v);
  return data;
}

const en = getDictionary('en');
const ar = getDictionary('ar');

describe('editable texts', () => {
  it('flattens every dictionary string, arrays of strings as lines, arrays of objects by index', () => {
    const entries = flattenTexts(en);
    const byPath = new Map(entries.map((e) => [e.path, e]));
    expect(byPath.get('home.heroTitle')).toEqual({ path: 'home.heroTitle', kind: 'text', value: en.home.heroTitle });
    expect(byPath.get('company.address')?.kind).toBe('lines');
    expect(byPath.get('about.values.0.title')?.value).toBe(en.about.values[0].title);
    expect(byPath.has('card.beds.other')).toBe(true);
    // Arabic has every editable English path.
    const arPaths = new Set(flattenTexts(ar).map((e) => e.path));
    for (const path of byPath.keys()) if (!path.match(/\.(zero|two|few|many)$/)) expect(arPaths.has(path), path).toBe(true);
  });

  it('applies overrides without touching the original, ignoring unknown paths and wrong kinds', () => {
    const edited = applyOverrides(en, {
      'home.heroTitle': 'Homes by the sea.',
      'company.address': ['Main Street', 'Jbeil'],
      'home.doesNotExist': 'x',
      'company.name': ['wrong kind'],
    });
    expect(edited.home.heroTitle).toBe('Homes by the sea.');
    expect(edited.company.address).toEqual(['Main Street', 'Jbeil']);
    expect(edited.company.name).toBe(en.company.name);
    expect(en.home.heroTitle).not.toBe('Homes by the sea.');
    expect((edited.home as Record<string, unknown>).doesNotExist).toBeUndefined();
  });

  it('protects placeholders the site fills in', () => {
    expect(placeholders('Since {year}, {year} and {count}')).toEqual(['{count}', '{year}']);
    expect(overrideProblem('Since {year}', 'Since forever')).toMatch(/\{year\}/);
    expect(overrideProblem('Since {year}', 'Depuis {year}')).toBeNull();
    expect(overrideProblem('Hello', '  ')).toMatch(/empty/);
    expect(overrideProblem(['a'], [])).toMatch(/line/);
  });

  it('labels paths for people', () => {
    expect(labelForPath('home.search.whereAny')).toBe('Search › Where Any');
    expect(labelForPath('about.values.1.title')).toBe('Values › #2 › Title');
  });

  it('parses the text fields of a form: changes, resets and placeholder errors', () => {
    const { changes, errors } = parseTexts(
      form({
        't.en.home.heroTitle': 'Homes by the sea.',
        't.ar.home.heroTitle': ar.home.heroTitle, // unchanged → back to default
        't.en.company.address': 'Main Street\n\n Jbeil ',
        't.en.home.brandEyebrow': 'Since forever',
        't.xx.home.heroTitle': 'ignored',
        't.en.home': 'not a text',
      }),
      { en, ar },
    );
    expect(changes).toEqual([
      { locale: 'en', path: 'home.heroTitle', value: 'Homes by the sea.' },
      { locale: 'ar', path: 'home.heroTitle', value: null },
      { locale: 'en', path: 'company.address', value: ['Main Street', 'Jbeil'] },
    ]);
    expect(errors['t.en.home.brandEyebrow']).toMatch(/\{year\}/);
  });
});

describe('website settings', () => {
  it('merges stored settings over the defaults, dropping unknown keys and wrong types', () => {
    const site = resolveSite({ contact: { phone: '+961 3 000 000', founded: 'nineteen' }, home: { showStats: false }, hacker: true });
    expect(site.contact.phone).toBe('+961 3 000 000');
    expect(site.contact.founded).toBe(DEFAULT_SITE.contact.founded);
    expect(site.home.showStats).toBe(false);
    expect(site.home.showSpotlight).toBe(true);
    expect('hacker' in site).toBe(false);
    expect(resolveSite(null)).toEqual(DEFAULT_SITE);
  });

  it('parses a settings form: unticked switches turn off, values are validated', () => {
    const ok = parseSettings(
      form({
        __settings: 'contact.phone,contact.email,contact.founded,home.showStats,home.showSpotlight,social.facebook,office.lat,office.lng,office.zoom',
        's.contact.phone': '03 123 456',
        's.contact.email': 'hello@alkhoury.example',
        's.contact.founded': '1995',
        's.home.showSpotlight': 'on',
        's.social.facebook': 'https://facebook.com/alkhoury',
        's.office.lat': '33.9',
        's.office.lng': '35.6',
        's.office.zoom': '15',
      }),
      DEFAULT_SITE,
      { thisYear: 2026 },
    );
    expect(ok.errors).toEqual({});
    expect(ok.settings.contact).toMatchObject({ phone: '03 123 456', email: 'hello@alkhoury.example', founded: 1995 });
    expect(ok.settings.home.showStats).toBe(false); // on the page but unticked
    expect(ok.settings.home.showBrandBand).toBe(true); // not on the page: unchanged
    expect(ok.settings.office).toEqual({ showMap: true, lat: 33.9, lng: 35.6, zoom: 15 });

    const bad = parseSettings(
      form({
        __settings: 'contact.phone,contact.email,contact.founded,social.instagram,office.zoom,stats.placed',
        's.contact.phone': '123',
        's.contact.email': 'nope',
        's.contact.founded': '2099',
        's.social.instagram': 'javascript:alert(1)',
        's.office.zoom': '40',
        's.stats.placed': '-3',
      }),
      DEFAULT_SITE,
      { thisYear: 2026 },
    );
    expect(Object.keys(bad.errors).sort()).toEqual(
      ['s.contact.email', 's.contact.founded', 's.contact.phone', 's.office.zoom', 's.social.instagram', 's.stats.placed'].sort(),
    );
  });

  it('builds phone, WhatsApp and map links', () => {
    expect(telHref('+961 1 234 567')).toBe('tel:+9611234567');
    expect(whatsappHref('Hi there', '03 123 456')).toBe('https://wa.me/9613123456?text=Hi%20there');
    const url = new URL(osmEmbedUrl({ lat: 33.8869, lng: 35.5131 }, 16, true));
    expect(url.hostname).toBe('www.openstreetmap.org');
    expect(url.searchParams.get('marker')).toBe('33.88690,35.51310');
    const [west, south, east, north] = url.searchParams.get('bbox')!.split(',').map(Number);
    expect(west < 35.5131 && east > 35.5131 && south < 33.8869 && north > 33.8869).toBe(true);
    expect(new URL(osmEmbedUrl({ lat: 33.8869, lng: 35.5131 }, 14, false)).searchParams.has('marker')).toBe(false);
  });

  it('reads coordinates from pasted map links', () => {
    expect(parseMapLink('https://www.google.com/maps/@33.8869,35.5131,17z')).toEqual({ lat: 33.8869, lng: 35.5131 });
    expect(parseMapLink('https://maps.google.com/?q=33.89,35.51')).toEqual({ lat: 33.89, lng: 35.51 });
    expect(parseMapLink('https://www.google.com/maps/place/X/data=!3d33.8869!4d35.5131')).toEqual({ lat: 33.8869, lng: 35.5131 });
    expect(parseMapLink('https://www.openstreetmap.org/#map=17/33.88690/35.51310')).toEqual({ lat: 33.8869, lng: 35.5131 });
    expect(parseMapLink('33.8869, 35.5131')).toEqual({ lat: 33.8869, lng: 35.5131 });
    expect(parseMapLink('Beirut')).toBeNull();
    expect(parseMapLink('200, 10')).toBeNull();
    expect(isValidPoint(0, 0)).toBe(false);
    expect(approximate({ lat: 33.88694, lng: 35.51312 })).toEqual({ lat: 33.89, lng: 35.51 });
  });
});

describe('per-listing display', () => {
  const record = PLACEHOLDER_LISTINGS.find((l) => l.type === 'house' && l.deal === 'sale' && l.bedrooms !== undefined)!;
  const rows = recordToRows(record, null);
  const row = {
    ...rows.listing,
    createdAt: '',
    updatedAt: '',
    display: {},
    lat: 33.88694,
    lng: 35.51312,
    mapMode: 'off',
  } as unknown as ListingRow;
  const photos = rows.photos as unknown as ListingPhotoRow[];

  it('shows everything by default, with no map', () => {
    const listing = rowToListing(row, photos, 'en');
    expect(listing.price).toBe(record.price);
    expect(listing.priceOnRequest).toBeUndefined();
    expect(listing.bedrooms).toBe(record.bedrooms);
    expect(listing.map).toBeUndefined();
    expect(listing.display?.hideCalculator).toBe(false);
  });

  it('removes hidden details on the server, so they never reach the browser', () => {
    const listing = rowToListing(
      { ...row, display: { hidePrice: true, hideArea: true, hideBedrooms: true, hideSize: true, hideFeatures: true } },
      photos,
      'en',
    );
    expect(listing.price).toBe(0);
    expect(listing.priceOnRequest).toBe(true);
    expect(listing.location.area).toBe('');
    expect(listing.bedrooms).toBeUndefined();
    expect(listing.areaSqm).toBeUndefined();
    expect(listing.plotSqm).toBeUndefined();
    expect(listing.features).toEqual([]);
    expect(listing.display?.hideCalculator).toBe(true); // nothing to calculate without a price
    expect(JSON.stringify(listing)).not.toContain(String(record.price));
    expect(listingPrice(listing, 'en', en)).toBe('Price on request');
    expect(listingPrice(listing, 'ar', ar)).toBe('السعر عند الطلب');
  });

  it('rounds an approximate pin and keeps an exact one', () => {
    expect(rowToListing({ ...row, mapMode: 'approximate' }, photos, 'en').map).toEqual({ lat: 33.89, lng: 35.51, exact: false });
    expect(rowToListing({ ...row, mapMode: 'exact' }, photos, 'en').map).toEqual({ lat: 33.88694, lng: 35.51312, exact: true });
    expect(rowToListing({ ...row, mapMode: 'exact', lat: null }, photos, 'en').map).toBeUndefined();
  });

  it('keeps price-on-request listings out of budget filters and last in price sorts', () => {
    const base = { type: 'house' as const, deal: 'sale' as const, region: 'beirut' as const, areaSqm: 100 };
    const items = [
      { ...base, id: 'a', price: 500_000 },
      { ...base, id: 'b', price: 0, priceOnRequest: true },
      { ...base, id: 'c', price: 200_000 },
    ];
    const budget = parseFilters({ deal: 'sale', maxPrice: '600000' });
    expect(filterListings(items, budget).map((l) => l.id)).toEqual(['a', 'c']);
    expect(sortListings(items, 'price-asc').map((l) => l.id)).toEqual(['c', 'a', 'b']);
    expect(sortListings(items, 'price-desc').map((l) => l.id)).toEqual(['a', 'c', 'b']);
  });

  it('parses display switches and the map pin from the listing form', () => {
    const fields = {
      status: 'draft',
      type: 'house',
      deal: 'sale',
      region: 'metn',
      price: '900000',
      areaSqm: '300',
      titleEn: 'Stone house',
      'display.hidePrice': 'on',
      'display.hideAdvisor': 'on',
      'display.notAFlag': 'on',
    };
    const off = parseListingForm(form(fields));
    expect(off.ok && off.data.display).toEqual({ hidePrice: true, hideAdvisor: true });
    expect(off.ok && off.data.mapMode).toBe('off');

    const missingPin = parseListingForm(form({ ...fields, mapMode: 'exact' }));
    expect(missingPin.ok).toBe(false);
    if (!missingPin.ok) expect(missingPin.fieldErrors.lat).toBeTruthy();

    const pinned = parseListingForm(form({ ...fields, mapMode: 'approximate', lat: '33.91', lng: '35.58' }));
    expect(pinned.ok && [pinned.data.mapMode, pinned.data.lat, pinned.data.lng]).toEqual(['approximate', 33.91, 35.58]);
  });
});
