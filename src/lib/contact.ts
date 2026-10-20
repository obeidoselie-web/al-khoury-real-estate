/**
 * Contact-form validation and sanitisation. Pure functions, shared by the server action and tests.
 * Never trust the browser: everything here runs on the server before an enquiry goes anywhere.
 */

export const CONTACT_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  phone: { max: 30 },
  message: { min: 10, max: 2000 },
} as const;

export type ContactField = 'name' | 'email' | 'phone' | 'message';

export interface ContactEnquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string | null;
}

export type ContactValues = Record<ContactField, string>;

export type ContactState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<ContactField, string>>;
      values: ContactValues;
    };

// C0/C1 control characters except tab (\u0009) and newline (\u000A); also bidi overrides.
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F‪-‮⁦-⁩]/g;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;
const ANGLE_BRACKETS = /[<>]/g;

/**
 * Normalises untrusted text: strips control/bidi characters and markup, collapses whitespace,
 * trims and truncates. React escapes on render, so this protects downstream consumers
 * (CRMs, email bodies, webhooks) that might not.
 */
export function sanitizeText(input: unknown, { maxLength, multiline = false }: { maxLength: number; multiline?: boolean }): string {
  if (typeof input !== 'string') return '';
  let value = input.normalize('NFKC').replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '');
  value = value.replace(HTML_TAGS, '').replace(ANGLE_BRACKETS, '');
  value = multiline
    ? value
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
    : value.replace(/\s+/g, ' ');
  return value.trim().slice(0, maxLength);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{6,}$/;
const PROPERTY_ID_PATTERN = /^[a-z0-9-]{1,120}$/;

export type ValidationResult =
  | { ok: true; data: ContactEnquiry }
  | { ok: false; fieldErrors: Partial<Record<ContactField, string>>; values: ContactValues };

/** Localised error messages; `message` may contain a `{min}` placeholder. */
export type ContactErrorMessages = Record<ContactField, string>;

export function validateContact(formData: FormData, messages: ContactErrorMessages): ValidationResult {
  const values: ContactValues = {
    name: sanitizeText(formData.get('name'), { maxLength: CONTACT_LIMITS.name.max }),
    email: sanitizeText(formData.get('email'), { maxLength: CONTACT_LIMITS.email.max }).toLowerCase(),
    phone: sanitizeText(formData.get('phone'), { maxLength: CONTACT_LIMITS.phone.max }),
    message: sanitizeText(formData.get('message'), { maxLength: CONTACT_LIMITS.message.max, multiline: true }),
  };

  const fieldErrors: Partial<Record<ContactField, string>> = {};

  if (values.name.length < CONTACT_LIMITS.name.min) fieldErrors.name = messages.name;
  if (!EMAIL_PATTERN.test(values.email)) fieldErrors.email = messages.email;
  if (values.phone && !PHONE_PATTERN.test(values.phone)) fieldErrors.phone = messages.phone;
  if (values.message.length < CONTACT_LIMITS.message.min) {
    fieldErrors.message = messages.message.replace('{min}', String(CONTACT_LIMITS.message.min));
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors, values };

  const rawPropertyId = formData.get('propertyId');
  const propertyId =
    typeof rawPropertyId === 'string' && PROPERTY_ID_PATTERN.test(rawPropertyId) ? rawPropertyId : null;

  return { ok: true, data: { ...values, propertyId } };
}

/** Hidden field real visitors never fill in; bots usually do. */
export const HONEYPOT_FIELD = 'company_website';

export function isLikelySpam(formData: FormData): boolean {
  const trap = formData.get(HONEYPOT_FIELD);
  return typeof trap === 'string' && trap.trim().length > 0;
}
