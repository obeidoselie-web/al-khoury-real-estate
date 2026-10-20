'use server';

import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { isLikelySpam, validateContact, type ContactState } from '@/lib/contact';
import { deliverEnquiry } from '@/lib/contact-delivery';

export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  const rawLocale = formData.get('locale');
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = getDictionary(locale).contact;

  // Quietly "succeed" for bots so they get no signal to retry.
  if (isLikelySpam(formData)) return { status: 'success', message: t.success };

  const result = validateContact(formData, t.errors);
  if (!result.ok) {
    return { status: 'error', message: t.checkFields, fieldErrors: result.fieldErrors, values: result.values };
  }

  try {
    // The locale tells the team which language to reply in.
    await deliverEnquiry({ ...result.data, locale });
  } catch (error) {
    console.error('[contact] Failed to deliver enquiry:', error instanceof Error ? error.message : error);
    const { name, email, phone, message } = result.data;
    return { status: 'error', message: t.deliveryFailed, fieldErrors: {}, values: { name, email, phone, message } };
  }

  return { status: 'success', message: t.success };
}
