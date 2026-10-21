import type { Metadata } from 'next';
import Link from 'next/link';

import { LEAD_KINDS, LEAD_STATUSES, type LeadKind, type LeadStatus } from '@/db/schema';
import { KIND_LABELS, STATUS_LABELS, formatDateTime, timeAgo } from '@/lib/admin/format';
import { isAdmin } from '@/lib/admin/permissions';
import { listAssignableStaff, listLeads } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../admin.module.css';

export const metadata: Metadata = { title: 'Leads' };

export default async function LeadsPage({ searchParams }: PageProps<'/admin/leads'>) {
  const user = await requireUser();
  const params = await searchParams;
  const status = LEAD_STATUSES.find((s) => s === params.status) as LeadStatus | undefined;
  const kind = LEAD_KINDS.find((k) => k === params.kind) as LeadKind | undefined;
  const assignee = isAdmin(user) && typeof params.assignee === 'string' ? params.assignee.slice(0, 64) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total, pages }, staff] = await Promise.all([
    listLeads(user, { status, kind, assignee, page }),
    isAdmin(user) ? listAssignableStaff() : Promise.resolve([]),
  ]);

  const href = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status, kind, assignee, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/admin/leads?${qs}` : '/admin/leads';
  };

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Leads</h1>
          <p className={styles.pageSub}>
            Enquiries, viewing requests and valuation requests from the website
            {isAdmin(user) ? '.' : ', routed to you.'}
          </p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <nav aria-label="Filter by status" className={styles.segmented}>
          <Link href={href({ status: undefined, page: undefined })} className={styles.segment} aria-current={!status ? 'page' : undefined}>
            All
          </Link>
          {LEAD_STATUSES.map((s) => (
            <Link key={s} href={href({ status: s, page: undefined })} className={styles.segment} aria-current={status === s ? 'page' : undefined}>
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </nav>
        <nav aria-label="Filter by type" className={styles.segmented}>
          <Link href={href({ kind: undefined, page: undefined })} className={styles.segment} aria-current={!kind ? 'page' : undefined}>
            Any type
          </Link>
          {LEAD_KINDS.map((k) => (
            <Link key={k} href={href({ kind: k, page: undefined })} className={styles.segment} aria-current={kind === k ? 'page' : undefined}>
              {KIND_LABELS[k]}
            </Link>
          ))}
        </nav>
        {isAdmin(user) && (
          <form action="/admin/leads" className={styles.search}>
            {status && <input type="hidden" name="status" value={status} />}
            {kind && <input type="hidden" name="kind" value={kind} />}
            <label htmlFor="assignee-filter" className="sr-only">
              Assigned to
            </label>
            <select id="assignee-filter" name="assignee" defaultValue={assignee ?? ''} className={styles.input}>
              <option value="">Anyone</option>
              <option value="none">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button type="submit" className={`${styles.btn} ${styles.btnGhost}`}>
              Filter
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          {status || kind || assignee ? 'No leads match these filters.' : 'No leads yet. Website enquiries will appear here as they arrive.'}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">
              Leads, newest first. {total} in total.
            </caption>
            <thead>
              <tr>
                <th scope="col">From</th>
                <th scope="col">Type</th>
                <th scope="col" className={styles.hideSm}>
                  About
                </th>
                <th scope="col">Status</th>
                {isAdmin(user) && (
                  <th scope="col" className={styles.hideSm}>
                    Assigned to
                  </th>
                )}
                <th scope="col">Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/admin/leads/${lead.id}`} className={styles.rowLink}>
                      {lead.name}
                    </Link>
                    <div className={`${styles.muted} ${styles.nowrap} ltr`}>{lead.phone ?? lead.email}</div>
                  </td>
                  <td>{KIND_LABELS[lead.kind]}</td>
                  <td className={styles.hideSm}>
                    {lead.listingTitle ?? (lead.kind === 'valuation' ? <span className={styles.muted}>Owner’s property</span> : <span className={styles.muted}>General</span>)}
                  </td>
                  <td>
                    <span className={`${styles.pill} ${styles[`pill_${lead.status}`]}`}>{STATUS_LABELS[lead.status]}</span>
                  </td>
                  {isAdmin(user) && (
                    <td className={styles.hideSm}>{lead.assigneeName ?? <span className={styles.muted}>Unassigned</span>}</td>
                  )}
                  <td className={`${styles.nowrap} ${styles.muted}`}>
                    <time dateTime={lead.createdAt} title={formatDateTime(lead.createdAt)}>
                      {timeAgo(lead.createdAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className={styles.pager}>
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className={`${styles.btn} ${styles.btnGhost}`}>
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className={styles.muted}>
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className={`${styles.btn} ${styles.btnGhost}`}>
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
