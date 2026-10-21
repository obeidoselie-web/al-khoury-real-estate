import type { Metadata } from 'next';
import Link from 'next/link';

import { PlusIcon, StarIcon } from '@/components/icons';
import { LISTING_STATUSES, type ListingStatus } from '@/db/schema';
import { STATUS_LABELS, formatUsd, timeAgo } from '@/lib/admin/format';
import { listListings } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Listings' };

const TYPE_LABELS: Record<string, string> = { house: 'House', apartment: 'Apartment', commercial: 'Commercial', land: 'Land' };

export default async function ListingsAdminPage({ searchParams }: PageProps<'/admin/listings'>) {
  const user = await requireUser();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const status = LISTING_STATUSES.find((s) => s === params.status) as ListingStatus | undefined;

  const [rows, all] = await Promise.all([listListings(user, { q, status }), listListings(user)]);
  const counts = Object.fromEntries(LISTING_STATUSES.map((s) => [s, all.filter((r) => r.status === s).length]));
  const href = (next: ListingStatus | undefined) => {
    const sp = new URLSearchParams();
    if (next) sp.set('status', next);
    if (q) sp.set('q', q);
    const qs = sp.toString();
    return qs ? `/admin/listings?${qs}` : '/admin/listings';
  };

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Listings</h1>
          <p className={styles.pageSub}>
            {user.role === 'admin' ? 'Every property on the website.' : 'Properties you look after.'} Only published listings with
            photos appear on the site.
          </p>
        </div>
        <Link href="/admin/listings/new" className={`${styles.btn} ${styles.btnGold}`}>
          <PlusIcon size={16} />
          New listing
        </Link>
      </header>

      {params.deleted && (
        <p className={`${styles.banner} ${styles.bannerOk}`} role="status" style={{ marginBottom: 'var(--space-4)' }}>
          Listing deleted.
        </p>
      )}

      <div className={styles.toolbar}>
        <nav aria-label="Filter by status" className={styles.segmented}>
          <Link href={href(undefined)} className={styles.segment} aria-current={!status ? 'page' : undefined}>
            All <span className={styles.segmentCount}>{all.length}</span>
          </Link>
          {LISTING_STATUSES.map((s) => (
            <Link key={s} href={href(s)} className={styles.segment} aria-current={status === s ? 'page' : undefined}>
              {STATUS_LABELS[s]} <span className={styles.segmentCount}>{counts[s]}</span>
            </Link>
          ))}
        </nav>
        <form role="search" className={styles.search} action="/admin/listings">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="listing-search" className="sr-only">
            Search listings
          </label>
          <input id="listing-search" name="q" type="search" defaultValue={q} placeholder="Search title, area or address" className={styles.input} />
          <button type="submit" className={`${styles.btn} ${styles.btnGhost}`}>
            Search
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          {q || status ? 'No listings match.' : 'No listings yet. Create the first one.'}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">Listings{status ? ` (${STATUS_LABELS[status]})` : ''}</caption>
            <thead>
              <tr>
                <th scope="col">Property</th>
                <th scope="col">Status</th>
                <th scope="col" className={styles.hideSm}>
                  Type
                </th>
                <th scope="col">Price</th>
                {user.role === 'admin' && (
                  <th scope="col" className={styles.hideSm}>
                    Advisor
                  </th>
                )}
                <th scope="col" className={styles.hideSm}>
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.cellMain}>
                      {row.cover ? (
                        // Plain img: admin thumbnails need no responsive variants.
                        <img src={row.cover} alt="" className={styles.thumb} loading="lazy" />
                      ) : (
                        <span className={styles.thumb} aria-hidden="true" />
                      )}
                      <div>
                        <Link href={`/admin/listings/${row.id}`} className={styles.rowLink}>
                          {row.titleEn}
                        </Link>
                        {row.featured && (
                          <span className={styles.star} title="Featured on the home page">
                            {' '}
                            <StarIcon size={14} filled />
                            <span className="sr-only">Featured</span>
                          </span>
                        )}
                        <div className={styles.muted}>
                          {row.areaEn}, {row.cityEn}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${row.status}`]}`}>{STATUS_LABELS[row.status]}</span>
                  </td>
                  <td className={styles.hideSm}>
                    {TYPE_LABELS[row.type] ?? row.type} · {row.deal === 'rent' ? 'Rent' : 'Sale'}
                  </td>
                  <td className={styles.num}>{formatUsd(row.price, row.deal)}</td>
                  {user.role === 'admin' && <td className={styles.hideSm}>{row.advisorName ?? <span className={styles.muted}>—</span>}</td>}
                  <td className={`${styles.hideSm} ${styles.nowrap} ${styles.muted}`}>{timeAgo(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
