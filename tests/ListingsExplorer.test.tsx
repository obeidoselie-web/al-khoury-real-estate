import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListingsExplorer } from '@/components/ListingsExplorer';
import type { Locale } from '@/i18n/config';
import { DEFAULT_FILTERS } from '@/lib/filters';

import { sampleListings } from './fixtures';
import { renderWithI18n } from './render';

function renderExplorer(initialFilters = DEFAULT_FILTERS, locale: Locale = 'en') {
  return renderWithI18n(<ListingsExplorer listings={sampleListings()} initialFilters={initialFilters} />, locale);
}

function resultCards(name = 'Matching properties') {
  const list = screen.queryByRole('list', { name });
  return list ? within(list).getAllByRole('article') : [];
}

describe('ListingsExplorer', () => {
  let replaceState: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    replaceState = vi.spyOn(window.history, 'replaceState');
  });

  it('shows every listing and an accessible results status initially', () => {
    renderExplorer();
    expect(resultCards()).toHaveLength(7);
    expect(screen.getByRole('status')).toHaveTextContent('7 properties');
  });

  it('exposes labelled radio groups for deal and type', () => {
    renderExplorer();
    expect(screen.getByRole('group', { name: 'Buy or rent' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Property type' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^All types/ })).toBeChecked();
  });

  it('filters instantly when a chip is tapped, announces the result and updates the URL', async () => {
    const user = userEvent.setup();
    renderExplorer();

    await user.click(screen.getByRole('radio', { name: /^Rent/ }));
    expect(resultCards()).toHaveLength(4);
    expect(screen.getByRole('status')).toHaveTextContent('4 properties for rent');
    expect(replaceState).toHaveBeenLastCalledWith(window.history.state, '', '?deal=rent');

    await user.click(screen.getByRole('radio', { name: /^Apartments/ }));
    expect(resultCards()).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('2 apartments for rent');
    expect(replaceState).toHaveBeenLastCalledWith(window.history.state, '', '?deal=rent&type=apartment');
  });

  it('shows option counts that reflect the other active filter', async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.click(screen.getByRole('radio', { name: /^Rent/ }));
    expect(screen.getByRole('radio', { name: /^Land, 0 listings/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^Apartments, 2 listings/ })).toBeInTheDocument();
  });

  it('supports keyboard-only use with arrow keys inside a group', async () => {
    const user = userEvent.setup();
    renderExplorer();
    screen.getByRole('radio', { name: /^All,/ }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /^Buy/ })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('3 properties for sale');
  });

  it('renders the empty state and recovers via "Show all properties"', async () => {
    const user = userEvent.setup();
    renderExplorer({ type: 'land', deal: 'rent' });

    expect(resultCards()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: /nothing matches/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No land plots for rent right now');

    await user.click(screen.getByRole('button', { name: 'Show all properties' }));
    expect(resultCards()).toHaveLength(7);
    expect(replaceState).toHaveBeenLastCalledWith(window.history.state, '', window.location.pathname);
  });

  it('offers "Clear filters" only when filters are active', async () => {
    const user = userEvent.setup();
    renderExplorer();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /^Houses/ }));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(resultCards()).toHaveLength(7);
    expect(screen.getByRole('radio', { name: /^All types/ })).toBeChecked();
  });

  it('links each card to its localised detail page', () => {
    renderExplorer({ type: 'commercial', deal: 'all' });
    const [card] = resultCards();
    expect(within(card).getByRole('link')).toHaveAttribute('href', expect.stringMatching(/^\/en\/listings\/commercial-rent-/));
  });

  describe('in Arabic', () => {
    it('labels filters, counts and results in Arabic with correct plural forms', async () => {
      const user = userEvent.setup();
      renderExplorer(DEFAULT_FILTERS, 'ar');

      expect(screen.getByRole('group', { name: 'شراء أو إيجار' })).toBeInTheDocument();
      // 7 → CLDR "few" form.
      expect(screen.getByRole('status')).toHaveTextContent('7 عقارات');

      await user.click(screen.getByRole('radio', { name: /^إيجار/ }));
      await user.click(screen.getByRole('radio', { name: /^شقق/ }));
      // 2 → dual form, with the deal phrase.
      expect(screen.getByRole('status')).toHaveTextContent('شقتان للإيجار');
      expect(resultCards('العقارات المطابقة')).toHaveLength(2);
      expect(within(resultCards('العقارات المطابقة')[0]).getByRole('link')).toHaveAttribute(
        'href',
        expect.stringMatching(/^\/ar\/listings\//),
      );
    });

    it('uses the Arabic empty-state sentence', () => {
      renderExplorer({ type: 'land', deal: 'rent' }, 'ar');
      expect(screen.getByRole('status')).toHaveTextContent('لا توجد أراضٍ للإيجار حاليًا');
    });
  });
});
