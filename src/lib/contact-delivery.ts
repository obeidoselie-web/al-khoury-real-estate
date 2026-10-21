import 'server-only';

import type { Locale } from '@/i18n/config';

import type { ContactEnquiry } from './contact';
import { recordLead, type NewLead } from './data/lead-store';

/** Every lead the site collects: general enquiries, viewing requests and owner valuation requests. */
export type LeadKind = 'enquiry' | 'viewing' | 'valuation';

export interface Lead {
  kind: LeadKind;
  locale: Locale;
  propertyId?: string | null;
  [field: string]: unknown;
}

const CORE_FIELDS = new Set(['kind', 'locale', 'propertyId', 'name', 'email', 'phone', 'message', 'notes']);

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);

/** Splits a validated form payload into inbox columns and kind-specific details. */
export function toNewLead(lead: Lead): NewLead {
  const details: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(lead)) {
    if (CORE_FIELDS.has(key)) continue;
    if (typeof value === 'string' || typeof value === 'number' || value === null) details[key] = value;
  }
  return {
    kind: lead.kind,
    locale: lead.locale,
    propertyId: lead.propertyId ?? null,
    name: text(lead.name) ?? 'Unknown',
    email: text(lead.email),
    phone: text(lead.phone),
    // Viewing requests call their free text "notes".
    message: text(lead.message) ?? text(lead.notes),
    details,
  };
}

/**
 * Saves a validated lead to the admin inbox (the record of truth) and, when CONTACT_WEBHOOK_URL is
 * set, also forwards it as JSON (with `kind`, so a CRM or automation can route it). Secrets are
 * server-only env vars and never reach the browser — note there is no NEXT_PUBLIC_ prefix.
 * The visitor sees a failure only if the lead reached neither the inbox nor the webhook.
 */
export async function deliverLead(lead: Lead): Promise<void> {
  let stored = false;
  try {
    await recordLead(toNewLead(lead));
    stored = true;
  } catch (error) {
    console.error('[contact] Could not save lead to the inbox:', error instanceof Error ? error.message : error);
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (!webhookUrl) {
    if (!stored) throw new Error('Lead could not be stored');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...lead, receivedAt: new Date().toISOString(), source: 'website' }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Lead webhook responded with ${response.status}`);
  } catch (error) {
    if (!stored) throw error;
    console.error('[contact] Lead saved, but the webhook failed:', error instanceof Error ? error.message : error);
  }
}

export function deliverEnquiry(enquiry: ContactEnquiry & { locale: Locale }): Promise<void> {
  return deliverLead({ ...enquiry, kind: 'enquiry' });
}
