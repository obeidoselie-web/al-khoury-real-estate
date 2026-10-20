import { sanitizeText } from './contact';
import { PROPERTY_TYPES, REGIONS, type PropertyType, type Region } from './types';

/** Owner valuation requests ("List your property"): validation shared by the server action and tests. */
export const INTENTS = ['sell', 'rent'] as const;
export type Intent = (typeof INTENTS)[number];

export type ValuationField = 'intent' | 'type' | 'region' | 'size' | 'name' | 'phone' | 'email';

export interface ValuationRequest {
  intent: Intent;
  type: PropertyType;
  region: Region;
  sizeSqm: number | null;
  name: string;
  phone: string;
  email: string;
  message: string;
}

export type ValuationValues = Record<ValuationField | 'message', string>;

export type ValuationState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors: Partial<Record<ValuationField, string>>; values: ValuationValues };

const PHONE = /^\+?[0-9 ()-]{6,}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateValuation(
  formData: FormData,
  messages: Record<ValuationField, string>,
): { ok: true; data: ValuationRequest } | { ok: false; fieldErrors: Partial<Record<ValuationField, string>>; values: ValuationValues } {
  const values: ValuationValues = {
    intent: sanitizeText(formData.get('intent'), { maxLength: 10 }),
    type: sanitizeText(formData.get('type'), { maxLength: 20 }),
    region: sanitizeText(formData.get('region'), { maxLength: 20 }),
    size: sanitizeText(formData.get('size'), { maxLength: 9 }).replace(/[,\s]/g, ''),
    name: sanitizeText(formData.get('name'), { maxLength: 100 }),
    phone: sanitizeText(formData.get('phone'), { maxLength: 30 }),
    email: sanitizeText(formData.get('email'), { maxLength: 254 }).toLowerCase(),
    message: sanitizeText(formData.get('message'), { maxLength: 2000, multiline: true }),
  };
  const fieldErrors: Partial<Record<ValuationField, string>> = {};

  if (!(INTENTS as readonly string[]).includes(values.intent)) fieldErrors.intent = messages.intent;
  if (!(PROPERTY_TYPES as readonly string[]).includes(values.type)) fieldErrors.type = messages.type;
  if (!(REGIONS as readonly string[]).includes(values.region)) fieldErrors.region = messages.region;
  if (values.size && !/^\d{1,7}$/.test(values.size)) fieldErrors.size = messages.size;
  if (values.name.length < 2) fieldErrors.name = messages.name;
  if (!PHONE.test(values.phone)) fieldErrors.phone = messages.phone;
  if (values.email && !EMAIL.test(values.email)) fieldErrors.email = messages.email;

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors, values };
  return {
    ok: true,
    data: {
      intent: values.intent as Intent,
      type: values.type as PropertyType,
      region: values.region as Region,
      sizeSqm: values.size ? Number(values.size) : null,
      name: values.name,
      phone: values.phone,
      email: values.email,
      message: values.message,
    },
  };
}
