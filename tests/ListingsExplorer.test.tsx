import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ListingsExplorer } from '@/components/ListingsExplorer';
import { DEFAULT_FILTERS } from '@/lib/filters';

import { sampleListings } from './fixtures';

function renderExplorer(initialFilters = DEFAULT_FILTERS) {
  return render(<ListingsExplorer listings={sampleListings()} initialFilters={initialFilters} />);
}

function resultCards() {
  const list = screen.queryByRole('list', { name: 'Matching properties' });
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

  it('links each card to its detail page', () => {
    renderExplorer({ type: 'commercial', deal: 'all' });
    const [card] = resultCards();
    const link = within(card).getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringMatching(/^\/listings\/commercial-rent-/));
  });
});
