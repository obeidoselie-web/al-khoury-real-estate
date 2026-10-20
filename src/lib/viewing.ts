import { sanitizeText } from './contact';

/** Viewing requests: validation shared by the server action and tests. */
export const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];
export const VIEWING_WINDOW_DAYS = 60;

export type ViewingField = 'name' | 'phone' | 'date' | 'time';

export interface ViewingRequest {
  name: string;
  phone: string;
  date: string;
  time: TimeSlot;
  notes: string;
  propertyId: string;
}

export type ViewingValues = { name: string; phone: string; date: string; time: string; notes: string };

export type ViewingState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors: Partial<Record<ViewingField, string>>; values: ViewingValues };

const PHONE = /^\+?[0-9 ()-]{6,}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PROPERTY_ID = /^[a-z0-9-]{1,120}$/;

/** "YYYY-MM-DD" for a date in local time. */
export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The selectable range: tomorrow → VIEWING_WINDOW_DAYS ahead. */
export function viewingDateRange(today = new Date()): { min: string; max: string } {
  const min = new Date(today);
  min.setDate(min.getDate() + 1);
  const max = new Date(today);
  max.setDate(max.getDate() + VIEWING_WINDOW_DAYS);
  return { min: isoDay(min), max: isoDay(max) };
}

export function validateViewing(
  formData: FormData,
  messages: Record<ViewingField, string>,
  today = new Date(),
): { ok: true; data: ViewingRequest } | { ok: false; fieldErrors: Partial<Record<ViewingField, string>>; values: ViewingValues } {
  const values: ViewingValues = {
    name: sanitizeText(formData.get('name'), { maxLength: 100 }),
    phone: sanitizeText(formData.get('phone'), { maxLength: 30 }),
    date: sanitizeText(formData.get('date'), { maxLength: 10 }),
    time: sanitizeText(formData.get('time'), { maxLength: 12 }),
    notes: sanitizeText(formData.get('notes'), { maxLength: 1000, multiline: true }),
  };
  const fieldErrors: Partial<Record<ViewingField, string>> = {};

  if (values.name.length < 2) fieldErrors.name = messages.name;
  if (!PHONE.test(values.phone)) fieldErrors.phone = messages.phone;
  const { min, max } = viewingDateRange(today);
  // ISO day strings compare correctly as text.
  if (!ISO_DATE.test(values.date) || values.date < min || values.date > max) fieldErrors.date = messages.date;
  if (!(TIME_SLOTS as readonly string[]).includes(values.time)) fieldErrors.time = messages.time;

  const rawId = formData.get('propertyId');
  // A tampered id is dropped rather than trusted; the advisor still gets the request.
  const propertyId = typeof rawId === 'string' && PROPERTY_ID.test(rawId) ? rawId : '';

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors, values };
  return { ok: true, data: { ...values, time: values.time as TimeSlot, propertyId } };
}
