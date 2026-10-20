'use server';

import { isLikelySpam, validateContact, type ContactState } from '@/lib/contact';
import { deliverEnquiry } from '@/lib/contact-delivery';

const SUCCESS_MESSAGE = 'Thank you — your message has been sent. An advisor will reply within one working day.';

export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  // Quietly "succeed" for bots so they get no signal to retry.
  if (isLikelySpam(formData)) return { status: 'success', message: SUCCESS_MESSAGE };

  const result = validateContact(formData);
  if (!result.ok) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: result.fieldErrors,
      values: result.values,
    };
  }

  try {
    await deliverEnquiry(result.data);
  } catch (error) {
    console.error('[contact] Failed to deliver enquiry:', error instanceof Error ? error.message : error);
    const { name, email, phone, message } = result.data;
    return {
      status: 'error',
      message: 'We couldn’t send your message just now. Please try again, or call us.',
      fieldErrors: {},
      values: { name, email, phone, message },
    };
  }

  return { status: 'success', message: SUCCESS_MESSAGE };
}
