import 'server-only';

import type { Locale } from '@/i18n/config';

import type { ContactEnquiry } from './contact';

/** Every lead the site collects: general enquiries, viewing requests and owner valuation requests. */
export type LeadKind = 'enquiry' | 'viewing' | 'valuation';

export interface Lead {
  kind: LeadKind;
  locale: Locale;
  propertyId?: string | null;
  [field: string]: unknown;
}

/**
 * Delivers a validated lead to CONTACT_WEBHOOK_URL as JSON (with `kind`, so a CRM or automation can
 * route it). Secrets are server-only env vars and never reach the browser — note there is no
 * NEXT_PUBLIC_ prefix. Without a webhook, receipt is logged without any personal data.
 */
export async function deliverLead(lead: Lead): Promise<void> {
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;

  if (!webhookUrl) {
    const label = lead.kind === 'enquiry' ? 'Enquiry' : lead.kind === 'viewing' ? 'Viewing request' : 'Valuation request';
    console.info(
      `[contact] ${label} received (${lead.locale})${lead.propertyId ? ` about ${lead.propertyId}` : ''} ` +
        '(CONTACT_WEBHOOK_URL not set, so it was not forwarded).',
    );
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lead, receivedAt: new Date().toISOString(), source: 'website' }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Lead webhook responded with ${response.status}`);
  }
}

export function deliverEnquiry(enquiry: ContactEnquiry & { locale: Locale }): Promise<void> {
  return deliverLead({ ...enquiry, kind: 'enquiry' });
}
