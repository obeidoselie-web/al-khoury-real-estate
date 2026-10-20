import 'server-only';

import type { Locale } from '@/i18n/config';

import type { ContactEnquiry } from './contact';

/**
 * Delivers a validated enquiry. Secrets (the webhook URL) are read from server-only env vars and
 * never reach the browser bundle — note there is no NEXT_PUBLIC_ prefix.
 */
export async function deliverEnquiry(enquiry: ContactEnquiry & { locale: Locale }): Promise<void> {
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;

  if (!webhookUrl) {
    // Development fallback: acknowledge receipt without logging personal data.
    console.info(
      `[contact] Enquiry received (${enquiry.locale})${enquiry.propertyId ? ` about ${enquiry.propertyId}` : ''} ` +
        '(CONTACT_WEBHOOK_URL not set, so it was not forwarded).',
    );
    return;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...enquiry, receivedAt: new Date().toISOString(), source: 'website' }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Enquiry webhook responded with ${response.status}`);
  }
}
