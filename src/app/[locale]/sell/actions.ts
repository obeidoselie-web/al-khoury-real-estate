'use server';

import { DEFAULT_LOCALE, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { isLikelySpam } from '@/lib/contact';
import { deliverLead } from '@/lib/contact-delivery';
import { validateValuation, type ValuationState } from '@/lib/valuation';

export async function requestValuation(_previous: ValuationState, formData: FormData): Promise<ValuationState> {
  const rawLocale = formData.get('locale');
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const s = getDictionary(locale).sell;

  if (isLikelySpam(formData)) return { status: 'success', message: s.success };

  const result = validateValuation(formData, s.errors);
  if (!result.ok) return { status: 'error', message: s.checkFields, fieldErrors: result.fieldErrors, values: result.values };

  try {
    await deliverLead({ kind: 'valuation', locale, ...result.data });
  } catch (error) {
    console.error('[contact] Failed to deliver valuation request:', error instanceof Error ? error.message : error);
    const d = result.data;
    return {
      status: 'error',
      message: s.failed,
      fieldErrors: {},
      values: {
        intent: d.intent,
        type: d.type,
        region: d.region,
        size: d.sizeSqm ? String(d.sizeSqm) : '',
        name: d.name,
        phone: d.phone,
        email: d.email,
        message: d.message,
      },
    };
  }
  return { status: 'success', message: s.success };
}
