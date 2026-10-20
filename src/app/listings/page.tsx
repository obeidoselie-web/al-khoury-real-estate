import type { Metadata } from 'next';

import { ListingsExplorer } from '@/components/ListingsExplorer';
import { getListingSummaries } from '@/lib/data/listings';
import { filtersToQueryString, parseFilters } from '@/lib/filters';

import styles from './listings.module.css';

export const metadata: Metadata = {
  title: 'Properties',
  description: 'Browse houses, apartments, commercial properties and land for sale or rent.',
};

interface ListingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const [params, listings] = await Promise.all([searchParams, getListingSummaries()]);
  const initialFilters = parseFilters(params);

  return (
    <div className="container">
      <header className={styles.header}>
        <h1 className={styles.title}>Properties</h1>
        <p className={styles.lead}>Filter by what you’re looking for. Results update instantly.</p>
      </header>
      {/* Keyed so a navigation to a different filtered URL (e.g. from the home page) resets state. */}
      <ListingsExplorer key={filtersToQueryString(initialFilters)} listings={listings} initialFilters={initialFilters} />
    </div>
  );
}
