import { LEAD_STATUSES, LISTING_STATUSES, MAP_MODES, ROLES, type LeadStatus, type ListingStatus, type MapMode, type Role } from '@/db/schema';

import { sanitizeText } from '../contact';
import { DISPLAY_FLAGS, compactDisplay, type ListingDisplay } from '../listing-display';
import { isValidPoint } from '../site';
import { slugify } from './slug';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS, type DealType, type PropertyType, type Region } from '../types';

/*
 * Parsing and validation for every admin form. Pure functions over FormData, so they are unit-tested
 * and shared by the Server Actions; nothing here trusts the browser (the same rules apply whether or
 * not the client-side checks ran).
 */

export type FieldErrors<F extends string = string> = Partial<Record<F, string>>;
export type Parsed<T, F extends string = string> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors<F> };

export { slugify };

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


const line = (form: FormData, name: string, max = 200) => sanitizeText(form.get(name), { maxLength: max });
const block = (form: FormData, name: string, max = 6000) => sanitizeText(form.get(name), { maxLength: max, multiline: true });

/** Paragraphs are separated by a blank line. */
export function toParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

/** One feature per line; leading bullets ("-", "•") are dropped. */
export function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

function optionalInt(
  form: FormData,
  name: string,
  { min, max }: { min: number; max: number },
  errors: FieldErrors,
  message: string,
): number | null {
  const raw = String(form.get(name) ?? '').replace(/[,\s]/g, '');
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    errors[name] = message;
    return null;
  }
  return value;
}

function oneOf<T extends string>(values: readonly T[], value: unknown): T | null {
  return typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : null;
}

// ---------- Listings ----------

export interface ListingInput {
  id: string;
  status: ListingStatus;
  type: PropertyType;
  deal: DealType;
  region: Region;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number;
  plotSqm: number | null;
  yearBuilt: number | null;
  featured: boolean;
  verified: boolean;
  listedAt: string;
  advisorId: string | null;
  titleEn: string;
  titleAr: string;
  areaEn: string;
  areaAr: string;
  cityEn: string;
  cityAr: string;
  summaryEn: string;
  summaryAr: string;
  descriptionEn: string[];
  descriptionAr: string[];
  featuresEn: string[];
  featuresAr: string[];
  display: Partial<ListingDisplay>;
  mapMode: MapMode;
  lat: number | null;
  lng: number | null;
}

/** Text fields echoed back to the form after a failed save. */
export type ListingFormValues = Record<string, string>;

export const LISTING_TEXT_FIELDS = [
  'titleEn',
  'titleAr',
  'areaEn',
  'areaAr',
  'cityEn',
  'cityAr',
  'summaryEn',
  'summaryAr',
  'descriptionEn',
  'descriptionAr',
] as const;

export function parseListingForm(form: FormData, { today = new Date() } = {}): Parsed<ListingInput> {
  const errors: FieldErrors = {};
  const required = 'Required.';

  const titleEn = line(form, 'titleEn', 120);
  const rawId = line(form, 'id', 80).toLowerCase();
  const id = rawId || slugify(titleEn);
  if (!id) errors.id = 'Enter a web address (or an English title to generate one).';
  else if (!SLUG_PATTERN.test(id)) errors.id = 'Use lowercase letters, digits and single hyphens.';

  const status = oneOf(LISTING_STATUSES, form.get('status')) ?? 'draft';
  const type = oneOf(PROPERTY_TYPES, form.get('type'));
  if (!type) errors.type = 'Choose a property type.';
  const deal = oneOf(DEAL_TYPES, form.get('deal'));
  if (!deal) errors.deal = 'Choose sale or rent.';
  const region = oneOf(REGIONS, form.get('region'));
  if (!region) errors.region = 'Choose a region.';

  const price = optionalInt(form, 'price', { min: 1, max: 1_000_000_000 }, errors, 'Enter a whole number of US dollars.');
  if (price === null && !errors.price) errors.price = required;
  const areaSqm = optionalInt(form, 'areaSqm', { min: 1, max: 10_000_000 }, errors, 'Enter square metres.');
  if (areaSqm === null && !errors.areaSqm) errors.areaSqm = required;
  const bedrooms = optionalInt(form, 'bedrooms', { min: 0, max: 50 }, errors, '0–50.');
  const bathrooms = optionalInt(form, 'bathrooms', { min: 0, max: 50 }, errors, '0–50.');
  const plotSqm = optionalInt(form, 'plotSqm', { min: 1, max: 10_000_000 }, errors, 'Enter square metres.');
  const yearBuilt = optionalInt(form, 'yearBuilt', { min: 1800, max: today.getUTCFullYear() + 5 }, errors, 'Enter a year.');

  let listedAt = line(form, 'listedAt', 10);
  if (!listedAt) listedAt = today.toISOString().slice(0, 10);
  else if (!DATE_PATTERN.test(listedAt) || Number.isNaN(Date.parse(`${listedAt}T00:00:00Z`))) errors.listedAt = 'Use a valid date.';

  const advisorId = line(form, 'advisorId', 64) || null;

  const display = compactDisplay(Object.fromEntries(DISPLAY_FLAGS.map((flag) => [flag, form.get(`display.${flag}`) === 'on'])));
  const mapMode = oneOf(MAP_MODES, form.get('mapMode')) ?? 'off';
  const latRaw = line(form, 'lat', 20);
  const lngRaw = line(form, 'lng', 20);
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  if (mapMode !== 'off' && !isValidPoint(lat, lng)) errors.lat = 'Pick the location on the map, or set the map to “Don’t show”.';

  const text = {
    titleEn,
    titleAr: line(form, 'titleAr', 120),
    areaEn: line(form, 'areaEn', 80),
    areaAr: line(form, 'areaAr', 80),
    cityEn: line(form, 'cityEn', 80),
    cityAr: line(form, 'cityAr', 80),
    summaryEn: line(form, 'summaryEn', 300),
    summaryAr: line(form, 'summaryAr', 300),
  };
  const descriptionEn = toParagraphs(block(form, 'descriptionEn'));
  const descriptionAr = toParagraphs(block(form, 'descriptionAr'));
  const featuresEn = toLines(block(form, 'featuresEn', 2000));
  const featuresAr = toLines(block(form, 'featuresAr', 2000));

  // Drafts may be incomplete; publishing needs both languages filled in.
  if (!text.titleEn) errors.titleEn = required;
  if (status === 'published') {
    for (const [key, value] of Object.entries(text)) if (!value) errors[key] = 'Required to publish.';
    if (descriptionEn.length === 0) errors.descriptionEn = 'Required to publish.';
    if (descriptionAr.length === 0) errors.descriptionAr = 'Required to publish.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return {
    ok: true,
    data: {
      id,
      status,
      type: type!,
      deal: deal!,
      region: region!,
      price: price!,
      bedrooms: type === 'land' ? null : bedrooms,
      bathrooms: type === 'land' ? null : bathrooms,
      areaSqm: areaSqm!,
      plotSqm,
      yearBuilt: type === 'land' ? null : yearBuilt,
      featured: form.get('featured') === 'on',
      verified: form.get('verified') === 'on',
      listedAt,
      advisorId,
      ...text,
      descriptionEn,
      descriptionAr,
      featuresEn,
      featuresAr,
      display,
      mapMode,
      lat: isValidPoint(lat, lng) ? lat : null,
      lng: isValidPoint(lat, lng) ? lng : null,
    },
  };
}

// ---------- Leads ----------

export function parseLeadStatus(value: unknown): LeadStatus | null {
  return oneOf(LEAD_STATUSES, value);
}

export function parseNote(form: FormData): Parsed<string, 'body'> {
  const body = block(form, 'body', 4000);
  return body ? { ok: true, data: body } : { ok: false, fieldErrors: { body: 'Write a note first.' } };
}

// ---------- Team ----------

export interface UserInput {
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export function parseUserForm(form: FormData): Parsed<UserInput, 'name' | 'email' | 'role'> {
  const errors: FieldErrors<'name' | 'email' | 'role'> = {};
  const name = line(form, 'name', 100);
  const email = line(form, 'email', 200).toLowerCase();
  const role = oneOf(ROLES, form.get('role'));
  if (!name) errors.name = 'Enter a name.';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
  if (!role) errors.role = 'Choose a role.';
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, data: { name, email, role: role!, active: form.get('active') !== 'off' } };
}

export interface ProfileInput {
  nameAr: string;
  titleEn: string;
  titleAr: string;
  languagesEn: string;
  languagesAr: string;
  phoneDisplay: string;
  phoneDigits: string;
  regions: Region[];
  visible: boolean;
  sortOrder: number;
}

type ProfileField = 'nameAr' | 'titleEn' | 'titleAr' | 'languagesEn' | 'languagesAr' | 'phoneDisplay';

export function parseProfileForm(form: FormData): Parsed<ProfileInput, ProfileField> {
  const errors: FieldErrors<ProfileField> = {};
  const data = {
    nameAr: line(form, 'nameAr', 100),
    titleEn: line(form, 'titleEn', 100),
    titleAr: line(form, 'titleAr', 100),
    languagesEn: line(form, 'languagesEn', 120),
    languagesAr: line(form, 'languagesAr', 120),
    phoneDisplay: line(form, 'phoneDisplay', 40),
  };
  for (const [key, value] of Object.entries(data)) if (!value) errors[key as ProfileField] = 'Required.';
  const phoneDigits = data.phoneDisplay.replace(/\D/g, '');
  if (data.phoneDisplay && (phoneDigits.length < 8 || phoneDigits.length > 15)) {
    errors.phoneDisplay = 'Use the international format, e.g. +961 3 123 456.';
  }
  const regions = form.getAll('regions').filter((r): r is Region => oneOf(REGIONS, r) !== null);
  const sortOrder = Number(form.get('sortOrder') ?? 0);
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return {
    ok: true,
    data: {
      ...data,
      phoneDigits,
      regions: [...new Set(regions)],
      visible: form.get('visible') === 'on',
      sortOrder: Number.isInteger(sortOrder) ? Math.max(0, Math.min(sortOrder, 999)) : 0,
    },
  };
}

/** Post-login destination: only same-site /admin paths (no open redirect). */
export function safeAdminPath(value: unknown): string {
  const next = typeof value === 'string' ? value : '';
  return /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) && !next.includes('//') && !next.includes('..') ? next : '/admin';
}
