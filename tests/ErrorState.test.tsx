import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ListingsError from '@/app/[locale]/listings/error';
import PropertyNotFound from '@/app/[locale]/listings/[id]/not-found';

import { renderWithI18n } from './render';

describe('route error and not-found states', () => {
  it('announces a failed fetch, focuses the heading and retries on demand', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithI18n(<ListingsError error={new Error('boom')} reset={reset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /couldn’t load properties/i })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('explains a missing property and offers a way back to listings', () => {
    renderWithI18n(<PropertyNotFound />);
    expect(screen.getByRole('heading', { name: /isn’t available/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse properties' })).toHaveAttribute('href', '/en/listings');
  });

  it('localises both states in Arabic', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderWithI18n(<ListingsError error={new Error('boom')} reset={vi.fn()} />, 'ar');
    expect(screen.getByRole('heading', { name: 'تعذّر تحميل العقارات.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حاول مجددًا' })).toBeInTheDocument();
    unmount();

    renderWithI18n(<PropertyNotFound />, 'ar');
    expect(screen.getByRole('link', { name: 'تصفّح العقارات' })).toHaveAttribute('href', '/ar/listings');
  });
});
