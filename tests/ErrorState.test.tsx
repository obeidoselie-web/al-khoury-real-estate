import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ListingsError from '@/app/listings/error';
import PropertyNotFound from '@/app/listings/[id]/not-found';

describe('route error and not-found states', () => {
  it('announces a failed fetch, focuses the heading and retries on demand', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ListingsError error={new Error('boom')} reset={reset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /couldn’t load properties/i })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('explains a missing property and offers a way back to listings', () => {
    render(<PropertyNotFound />);
    expect(screen.getByRole('heading', { name: /isn’t available/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse properties' })).toHaveAttribute('href', '/listings');
  });
});
