import type { Metadata } from 'next';
import Link from 'next/link';

import { PlusIcon } from '@/components/icons';
import { KIND_LABELS, STATUS_LABELS, timeAgo } from '@/lib/admin/format';
import { getDashboard } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../admin.module.css';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const d = await getDashboard(user);
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Good to see you, {firstName}</h1>
          <p className={styles.pageSub}>
            {user.role === 'admin' ? 'Everything across Al Khoury today.' : 'Your listings and the leads routed to you.'}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/listings/new" className={`${styles.btn} ${styles.btnGold}`}>
            <PlusIcon size={16} />
            New listing
          </Link>
        </div>
      </header>

      {denied && (
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          That page is for admins only.
        </p>
      )}

      <section aria-label="At a glance" className={styles.stats}>
        <Link href="/admin/leads?status=new" className={`${styles.stat} ${d.leads.new > 0 ? styles.statAccent : ''}`}>
          <span className={styles.statLabel}>New leads</span>
          <span className={styles.statValue}>{d.leads.new}</span>
          <span className={styles.statHint}>Waiting for a first reply</span>
        </Link>
        <Link href="/admin/leads" className={styles.stat}>
          <span className={styles.statLabel}>Leads this week</span>
          <span className={styles.statValue}>{d.leads.lastWeek}</span>
          <span className={styles.statHint}>
            {d.leads.contacted} in progress · {d.leads.closed} closed overall
          </span>
        </Link>
        <Link href="/admin/listings?status=published" className={styles.stat}>
          <span className={styles.statLabel}>Live listings</span>
          <span className={styles.statValue}>{d.listings.published}</span>
          <span className={styles.statHint}>
            {d.listings.draft} draft · {d.listings.archived} archived
          </span>
        </Link>
        {user.role === 'admin' && (
          <Link href="/admin/leads?assignee=none" className={`${styles.stat} ${d.leads.unassigned > 0 ? styles.statAccent : ''}`}>
            <span className={styles.statLabel}>Unassigned</span>
            <span className={styles.statValue}>{d.leads.unassigned}</span>
            <span className={styles.statHint}>New leads with no advisor</span>
          </Link>
        )}
      </section>

      <div className={styles.grid2}>
        <section className={styles.card} aria-labelledby="recent-leads">
          <div className={styles.cardHead}>
            <h2 id="recent-leads" className={styles.cardTitle}>
              Latest leads
            </h2>
            <Link href="/admin/leads" className={styles.cardLink}>
              All leads
            </Link>
          </div>
          {d.recentLeads.length === 0 ? (
            <p className={styles.empty}>No leads yet. Enquiries, viewing and valuation requests from the website land here.</p>
          ) : (
            <ul className={styles.feed}>
              {d.recentLeads.map((lead) => (
                <li key={lead.id}>
                  <div className={styles.feedMain}>
                    <Link href={`/admin/leads/${lead.id}`} className={styles.feedTitle}>
                      {lead.name}
                    </Link>{' '}
                    <span className={`${styles.pill} ${styles[`pill_${lead.status}`]}`}>{STATUS_LABELS[lead.status]}</span>
                    <p className={styles.feedMeta}>
                      {KIND_LABELS[lead.kind]}
                      {lead.listingTitle ? ` · ${lead.listingTitle}` : ''}
                    </p>
                  </div>
                  <time className={styles.time} dateTime={lead.createdAt}>
                    {timeAgo(lead.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card} aria-labelledby="activity">
          <div className={styles.cardHead}>
            <h2 id="activity" className={styles.cardTitle}>
              Recent activity
            </h2>
          </div>
          {d.recentActivity.length === 0 ? (
            <p className={styles.empty}>Changes to listings, leads and the team appear here.</p>
          ) : (
            <ul className={styles.feed}>
              {d.recentActivity.map((item) => (
                <li key={item.id}>
                  <div className={styles.feedMain}>
                    <p>{item.summary}</p>
                    <p className={styles.feedMeta}>{item.actor ?? 'Website'}</p>
                  </div>
                  <time className={styles.time} dateTime={item.at}>
                    {timeAgo(item.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
