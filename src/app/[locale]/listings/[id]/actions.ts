'use server';

import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { isLikelySpam } from '@/lib/contact';
import { deliverLead } from '@/lib/contact-delivery';
import { validateViewing, type ViewingState } from '@/lib/viewing';

export async function requestViewing(_previous: ViewingState, formData: FormData): Promise<ViewingState> {
  const rawLocale = formData.get('locale');
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const v = getDictionary(locale).property.viewing;

  if (isLikelySpam(formData)) return { status: 'success', message: v.success };

  const result = validateViewing(formData, v.errors);
  if (!result.ok) return { status: 'error', message: v.checkFields, fieldErrors: result.fieldErrors, values: result.values };

  try {
    await deliverLead({ kind: 'viewing', locale, ...result.data });
  } catch (error) {
    console.error('[contact] Failed to deliver viewing request:', error instanceof Error ? error.message : error);
    const { name, phone, date, time, notes } = result.data;
    return { status: 'error', message: v.failed, fieldErrors: {}, values: { name, phone, date, time, notes } };
  }
  return { status: 'success', message: v.success };
}
