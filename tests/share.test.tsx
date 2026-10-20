import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareButton } from '@/components/ShareButton';
import { whatsappHref } from '@/lib/company';

import { renderWithI18n } from './render';

/** userEvent.setup() installs its own navigator.clipboard, so call this after it. */
function stubNavigator(props: { share?: unknown; clipboard?: unknown }) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(navigator, key, { value, configurable: true, writable: true });
  }
}

afterEach(() => {
  stubNavigator({ share: undefined, clipboard: undefined });
});

describe('ShareButton', () => {
  it('uses the system share sheet when the browser has one', async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    stubNavigator({ share, clipboard: { writeText } });
    renderWithI18n(<ShareButton title="Stone villa" />);

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(share).toHaveBeenCalledWith({ title: 'Stone villa', url: window.location.href });
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('says nothing when the visitor dismisses the share sheet', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn();
    stubNavigator({ share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')), clipboard: { writeText } });
    renderWithI18n(<ShareButton title="Stone villa" />);

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('falls back to copying the link, with a polite status message', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ share: undefined, clipboard: { writeText } });
    renderWithI18n(<ShareButton title="Stone villa" />);

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied to the clipboard.');
  });

  it('copies the link if the share sheet fails for another reason', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ share: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')), clipboard: { writeText } });
    renderWithI18n(<ShareButton title="Stone villa" />);

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(writeText).toHaveBeenCalled();
  });

  it('explains what to do when copying is not allowed', async () => {
    const user = userEvent.setup();
    stubNavigator({ share: undefined, clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    renderWithI18n(<ShareButton title="Stone villa" />);

    await user.click(screen.getByRole('button', { name: 'Share' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Couldn’t copy the link. Please copy it from the address bar.');
  });

  it('copes with a browser that has no clipboard API, in Arabic', async () => {
    const user = userEvent.setup();
    stubNavigator({ share: undefined, clipboard: undefined });
    renderWithI18n(<ShareButton title="فيلا" />, 'ar');

    await user.click(screen.getByRole('button', { name: 'مشاركة' }));
    expect(await screen.findByRole('status')).toHaveTextContent('تعذّر نسخ الرابط. يُرجى نسخه من شريط العنوان.');
  });
});

describe('whatsappHref', () => {
  it('builds a wa.me link with an encoded, pre-filled message', () => {
    expect(whatsappHref('Hello “Villa” & more: https://x.test/en/listings/v-1', '96170000000')).toBe(
      'https://wa.me/96170000000?text=Hello%20%E2%80%9CVilla%E2%80%9D%20%26%20more%3A%20https%3A%2F%2Fx.test%2Fen%2Flistings%2Fv-1',
    );
  });
});
