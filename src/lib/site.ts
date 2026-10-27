/*
 * Website settings that aren't translated text: contact numbers, social links, the office map pin,
 * the hero photo and which page sections are shown. Stored as one JSON document (Admin → Website)
 * and merged over these defaults, so a new setting always has a value.
 * Translatable text (address lines, opening hours, headlines…) lives in the dictionaries and is
 * edited through content overrides (src/lib/content/texts.ts).
 */

export interface SiteImage {
  src: string;
  width: number;
  height: number;
  /** Tiny blurred preview shown while the photo loads. */
  blurDataURL: string;
}

export interface SiteSettings {
  contact: {
    /** As displayed, e.g. "+961 1 234 567". The dialling digits are derived from it. */
    phone: string;
    whatsapp: string;
    email: string;
    founded: number;
  };
  social: { facebook: string; instagram: string; linkedin: string; tiktok: string; youtube: string };
  office: { showMap: boolean; lat: number; lng: number; zoom: number };
  hero: { image: SiteImage; showSearch: boolean };
  home: { showSpotlight: boolean; showFeatured: boolean; showTypeRows: boolean; showStats: boolean; showBrandBand: boolean };
  about: { showStats: boolean; showValues: boolean; showHours: boolean };
  stats: { placed: number; regions: number };
  header: { showPhone: boolean };
  whatsappButton: { show: boolean };
  listings: ListingDisplaySettings;
}

export const LISTING_VIEWS = ['grid', 'list'] as const;
export type ListingView = (typeof LISTING_VIEWS)[number];
export const PHOTO_SHAPES = ['square', 'landscape', 'portrait'] as const;
export type PhotoShape = (typeof PHOTO_SHAPES)[number];

/** How property cards and the Properties page look (Admin → Website → Listings). */
export interface ListingDisplaySettings {
  /** What the Properties page opens with. */
  defaultView: ListingView;
  /** Let visitors switch between grid and list. */
  allowViewSwitch: boolean;
  /** Cards per row on wide screens (2–5); smaller screens fit what they can. */
  columns: number;
  photoShape: PhotoShape;
  showBadge: boolean;
  showFavourite: boolean;
  showType: boolean;
  showLocation: boolean;
  showFacts: boolean;
}

/** Allowed values for choice settings, checked when the admin saves. */
export const SETTING_CHOICES: Record<string, readonly string[]> = {
  'listings.defaultView': LISTING_VIEWS,
  'listings.photoShape': PHOTO_SHAPES,
};

export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/** 24px preview of the bundled hero photo (generated with sharp). */
const HERO_BLUR =
  'data:image/webp;base64,UklGRqQAAABXRUJQVlA4IJgAAACQBACdASoYAA0APtFUo0uoJKMhsAgBABoJYgCdMoMYJn/AXZ7qOgX7pEeYysYA/eKaf5jVJjHqlbdT+1YuyNWbRIvi6VkrZ9D+IBx53SaVHiw3wsFeo49855L3dXzSJqdZ8Qx82/IZ72G7ekrQwQU2I13XWoO6zLIRFAfqxNj8KZtnwlq5Gan/0SVUIP2qdb5HIr3nzdYAAA==';

/** PLACEHOLDER defaults (the original hard-coded values). Change them in Admin → Website. */
export const DEFAULT_SITE: SiteSettings = {
  contact: {
    phone: '+961 1 234 567',
    whatsapp: '+961 70 123 456',
    email: 'info@alkhoury-realestate.example',
    founded: 1998,
  },
  social: { facebook: '', instagram: '', linkedin: '', tiktok: '', youtube: '' },
  // Charles Malek Avenue, Achrafieh.
  office: { showMap: true, lat: 33.8869, lng: 35.5131, zoom: 16 },
  hero: { image: { src: '/images/photos/hero-villa-dusk.jpg', width: 2400, height: 1350, blurDataURL: HERO_BLUR }, showSearch: true },
  home: { showSpotlight: true, showFeatured: true, showTypeRows: true, showStats: true, showBrandBand: true },
  about: { showStats: true, showValues: true, showHours: true },
  stats: { placed: 2400, regions: 6 },
  header: { showPhone: true },
  whatsappButton: { show: true },
  listings: {
    defaultView: 'grid',
    allowViewSwitch: true,
    columns: 4,
    photoShape: 'square',
    showBadge: true,
    showFavourite: true,
    showType: true,
    showLocation: true,
    showFacts: true,
  },
};

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Deep-merges stored settings over the defaults, keeping only known keys of the right type. */
export function resolveSite(stored: unknown, defaults: SiteSettings = DEFAULT_SITE): SiteSettings {
  const merge = (base: Plain, over: unknown): Plain => {
    const out: Plain = {};
    for (const [key, value] of Object.entries(base)) {
      const candidate = isPlain(over) ? over[key] : undefined;
      if (isPlain(value)) out[key] = merge(value, candidate);
      else out[key] = typeof candidate === typeof value ? candidate : value;
    }
    return out;
  };
  const site = merge(defaults as unknown as Plain, stored) as unknown as SiteSettings;
  const l = site.listings;
  if (!LISTING_VIEWS.includes(l.defaultView)) l.defaultView = defaults.listings.defaultView;
  if (!PHOTO_SHAPES.includes(l.photoShape)) l.photoShape = defaults.listings.photoShape;
  l.columns = Math.min(5, Math.max(2, Math.round(l.columns) || defaults.listings.columns));
  return site;
}

/**
 * International digits for tel:/wa.me links. Local Lebanese numbers ("03 123 456") get +961;
 * "00" prefixes become "+".
 */
export function internationalDigits(phone: string, countryCode = '961'): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return countryCode + digits.slice(1);
  return digits;
}

export const telHref = (phone: string) => `tel:+${internationalDigits(phone)}`;

/** A WhatsApp "click to chat" link with a pre-filled message. */
export function whatsappHref(message: string, phone: string): string {
  return `https://wa.me/${internationalDigits(phone)}?text=${encodeURIComponent(message)}`;
}

/** What client components need (passed through the I18n provider). */
export interface PublicContact {
  phone: string;
  phoneHref: string;
  whatsapp: string;
  email: string;
  showWhatsappButton: boolean;
  listings: ListingDisplaySettings;
}

export function publicContact(site: SiteSettings): PublicContact {
  return {
    phone: site.contact.phone,
    phoneHref: telHref(site.contact.phone),
    whatsapp: site.contact.whatsapp,
    email: site.contact.email,
    showWhatsappButton: site.whatsappButton.show,
    listings: site.listings,
  };
}

// ---------- Maps (OpenStreetMap, no API key) ----------

export interface MapPoint {
  lat: number;
  lng: number;
}

export function isValidPoint(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

/** ~1 km precision: enough to show the neighbourhood without revealing the building. */
export function approximate(point: MapPoint): MapPoint {
  return { lat: Math.round(point.lat * 100) / 100, lng: Math.round(point.lng * 100) / 100 };
}

/** OpenStreetMap embed URL centred on a point; `marker` pins it. */
export function osmEmbedUrl({ lat, lng }: MapPoint, zoom: number, marker: boolean): string {
  // One 256px tile spans 360 / 2^zoom degrees of longitude. The embed picks the closest zoom that
  // fits the box in the frame, so a box under two tiles wide keeps the requested zoom in a ~600px map.
  const span = 360 / 2 ** zoom;
  const dLng = span * 0.9;
  const dLat = span * 0.45;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map((n) => n.toFixed(5)).join(',');
  const params = new URLSearchParams({ bbox, layer: 'mapnik' });
  if (marker) params.set('marker', `${lat.toFixed(5)},${lng.toFixed(5)}`);
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function directionsHref({ lat, lng }: MapPoint): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lng.toFixed(5)}`;
}

/** Reads coordinates from a pasted Google Maps / OpenStreetMap link or a "lat, lng" pair. */
export function parseMapLink(input: string): MapPoint | null {
  const text = decodeURIComponent(input.trim());
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // google.com/maps/@33.88,35.51,17z
    /[?&](?:q|query|ll|center|mlat)=(-?\d+(?:\.\d+)?)[,&](?:mlon=)?(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // place links
    /#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/, // openstreetmap.org/#map=17/33.88/35.51
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const point = { lat: Number(match[1]), lng: Number(match[2]) };
      if (isValidPoint(point.lat, point.lng)) return point;
    }
  }
  return null;
}
