import { afterEach, describe, expect, it, vi } from 'vitest';

import { submitContact } from '@/app/[locale]/about/actions';
import { getDictionary } from '@/i18n/dictionaries';
import { HONEYPOT_FIELD, isLikelySpam, sanitizeText, validateContact } from '@/lib/contact';

const messages = getDictionary('en').contact.errors;

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const VALID = {
  name: 'Rania Haddad',
  email: 'Rania@Example.com',
  phone: '+961 3 123 456',
  message: 'I would like to arrange a viewing this week.',
};

describe('sanitizeText', () => {
  it('strips markup, control and bidi characters', () => {
    expect(sanitizeText('<b>Hi</b> <script>alert(1)</script>there', { maxLength: 100 })).toBe('Hi alert(1)there');
    expect(sanitizeText('a\u0000b‮c', { maxLength: 100 })).toBe('abc');
  });

  it('collapses whitespace on single-line fields but keeps paragraphs in multiline ones', () => {
    expect(sanitizeText('  Rania \n  Haddad  ', { maxLength: 100 })).toBe('Rania Haddad');
    expect(sanitizeText('Line one\r\n\r\n\r\n\r\nLine   two', { maxLength: 100, multiline: true })).toBe('Line one\n\nLine two');
  });

  it('truncates to the max length and rejects non-strings', () => {
    expect(sanitizeText('x'.repeat(50), { maxLength: 10 })).toHaveLength(10);
    expect(sanitizeText(new File(['x'], 'x.txt'), { maxLength: 10 })).toBe('');
    expect(sanitizeText(null, { maxLength: 10 })).toBe('');
  });
});

describe('validateContact', () => {
  it('accepts a valid enquiry and normalises the email', () => {
    const result = validateContact(form({ ...VALID, propertyId: 'loft-mar-mikhael' }), messages);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe('rania@example.com');
      expect(result.data.propertyId).toBe('loft-mar-mikhael');
    }
  });

  it('reports a message per invalid field', () => {
    const result = validateContact(form({ name: 'R', email: 'nope', phone: 'call me', message: 'hi' }), messages);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(['email', 'message', 'name', 'phone']);
    }
  });

  it('treats phone as optional', () => {
    expect(validateContact(form({ ...VALID, phone: '' }), messages).ok).toBe(true);
  });

  it('drops a tampered propertyId instead of trusting it', () => {
    const result = validateContact(form({ ...VALID, propertyId: '"><img src=x>' }), messages);
    expect(result.ok && result.data.propertyId).toBeNull();
  });
});

describe('submitContact server action', () => {
  afterEach(() => {
    delete process.env.CONTACT_WEBHOOK_URL;
  });

  it('returns field errors and sanitised values for invalid input', async () => {
    const state = await submitContact({ status: 'idle' }, form({ ...VALID, email: 'bad', name: '<i>Rania</i>' }));
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.fieldErrors.email).toBeDefined();
      expect(state.values.name).toBe('Rania');
    }
  });

  it('succeeds without a webhook configured and logs no personal data', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const state = await submitContact({ status: 'idle' }, form(VALID));
    expect(state.status).toBe('success');
    const logged = info.mock.calls.flat().join(' ');
    expect(logged).not.toContain('Rania');
    expect(logged).not.toContain('example.com');
  });

  it('posts to the webhook and surfaces delivery failures gracefully', async () => {
    process.env.CONTACT_WEBHOOK_URL = 'https://hooks.example.test/enquiries';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 502 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const state = await submitContact({ status: 'idle' }, form(VALID));
    expect(fetchMock).toHaveBeenCalledWith('https://hooks.example.test/enquiries', expect.objectContaining({ method: 'POST' }));
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.message).toMatch(/couldn’t send/);
      expect(state.values.message).toBe(VALID.message);
    }
  });

  it('validates and replies in Arabic when the form was sent from the Arabic site', async () => {
    const state = await submitContact({ status: 'idle' }, form({ ...VALID, email: 'bad', locale: 'ar' }));
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.message).toBe('يُرجى مراجعة الحقول المحدّدة.');
      expect(state.fieldErrors.email).toMatch(/بريد إلكتروني/);
    }
  });

  it('ignores an unknown locale field and falls back to English', async () => {
    const state = await submitContact({ status: 'idle' }, form({ ...VALID, email: 'bad', locale: 'xx' }));
    expect(state.status === 'error' && state.message).toBe('Please check the highlighted fields.');
  });

  it('silently accepts honeypot submissions without delivering them', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    process.env.CONTACT_WEBHOOK_URL = 'https://hooks.example.test/enquiries';
    const data = form({ ...VALID, [HONEYPOT_FIELD]: 'http://spam.example' });
    expect(isLikelySpam(data)).toBe(true);
    expect((await submitContact({ status: 'idle' }, data)).status).toBe('success');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
