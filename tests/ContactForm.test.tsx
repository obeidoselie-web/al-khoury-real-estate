import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ContactForm } from '@/components/ContactForm';
import type { ContactState } from '@/lib/contact';

describe('ContactForm', () => {
  it('labels every field and pre-fills the message for a property enquiry', () => {
    render(<ContactForm propertyId="loft-1" propertyTitle="Loft in Gemmayzeh" action={vi.fn()} />);
    expect(screen.getByLabelText('Full name')).toBeRequired();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/Phone/)).not.toBeRequired();
    expect(screen.getByLabelText('Message')).toHaveValue('Hello, I’m interested in “Loft in Gemmayzeh”. ');
  });

  it('shows server errors inline, marks fields invalid and focuses the first one', async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async (): Promise<ContactState> => ({
        status: 'error',
        message: 'Please check the highlighted fields.',
        fieldErrors: { email: 'Please enter a valid email address.' },
        values: { name: 'Rania', email: 'bad', phone: '', message: 'Hello there, viewing please.' },
      }),
    );
    render(<ContactForm action={action} />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please check the highlighted fields.');
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Please enter a valid email address.');
    expect(email).toHaveFocus();
    expect(screen.getByLabelText('Full name')).toHaveValue('Rania');
  });

  it('replaces the form with a focused confirmation on success', async () => {
    const user = userEvent.setup();
    const action = vi.fn(async (): Promise<ContactState> => ({ status: 'success', message: 'Thanks!' }));
    render(<ContactForm action={action} />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Message sent.');
    expect(status).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
  });
});
