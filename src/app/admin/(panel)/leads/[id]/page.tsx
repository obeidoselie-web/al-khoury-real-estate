import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ChatIcon, MailIcon, PhoneIcon } from '@/components/icons';
import { LEAD_STATUSES } from '@/db/schema';
import { getDictionary } from '@/i18n/dictionaries';
import { KIND_LABELS, STATUS_LABELS, formatDateTime, internationalDigits } from '@/lib/admin/format';
import { canAssignLead, canSeeLead } from '@/lib/admin/permissions';
import { getLead, listAssignableStaff } from '@/lib/admin/queries';
import { requireUser } from '@/lib/auth/session';

import styles from '../../../admin.module.css';
import { assignLead, setLeadStatus } from '../actions';
import { NoteForm } from '../NoteForm';

export const metadata: Metadata = { title: 'Lead' };

const TIME_SLOTS: Record<string, string> = { morning: 'Morning (9–12)', afternoon: 'Afternoon (12–4)', evening: 'Evening (4–7)' };

export default async function LeadPage({ params }: PageProps<'/admin/leads/[id]'>) {
  const user = await requireUser();
  const { id } = await params;
  const found = await getLead(id);
  if (!found || !canSeeLead(user, found.lead)) notFound();
  const { lead, listingTitle, assigneeName, notes, history } = found;
  const staff = canAssignLead(user) ? await listAssignableStaff() : [];
  const en = getDictionary('en');
  const d = lead.details;
  const phoneDigits = lead.phone ? internationalDigits(lead.phone) : '';

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: 'Type', value: KIND_LABELS[lead.kind] },
    { label: 'Received', value: formatDateTime(lead.createdAt) },
    { label: 'Language', value: lead.locale === 'ar' ? 'Arabic — reply in Arabic' : 'English' },
  ];
  if (lead.listingId) {
    facts.push({
      label: 'Property',
      value: <Link href={`/admin/listings/${lead.listingId}`}>{listingTitle ?? lead.listingId}</Link>,
    });
  }
  if (lead.kind === 'viewing') {
    if (d.date) facts.push({ label: 'Preferred day', value: String(d.date) });
    if (d.time) facts.push({ label: 'Preferred time', value: TIME_SLOTS[String(d.time)] ?? String(d.time) });
  }
  if (lead.kind === 'valuation') {
    if (d.intent) facts.push({ label: 'Wants to', value: d.intent === 'rent' ? 'Rent it out' : 'Sell' });
    if (d.type) facts.push({ label: 'Property type', value: en.types[d.type as keyof typeof en.types]?.label ?? String(d.type) });
    if (d.region) facts.push({ label: 'Region', value: en.regions[d.region as keyof typeof en.regions] ?? String(d.region) });
    if (d.sizeSqm) facts.push({ label: 'Size', value: `${d.sizeSqm} m²` });
  }

  return (
    <>
      <header className={styles.pageHead}>
        <div>
          <Link href="/admin/leads" className={styles.crumb}>
            ‹ Leads
          </Link>
          <h1 className={styles.pageTitle}>{lead.name}</h1>
          <p className={styles.pageSub}>
            <span className={`${styles.pill} ${styles[`pill_${lead.status}`]}`}>{STATUS_LABELS[lead.status]}</span> {KIND_LABELS[lead.kind]}
            {listingTitle ? ` · ${listingTitle}` : ''}
          </p>
        </div>
        <div className={styles.actions}>
          {lead.phone && (
            <a href={`tel:+${phoneDigits}`} className={`${styles.btn} ${styles.btnGhost}`}>
              <PhoneIcon size={16} />
              Call
            </a>
          )}
          {lead.phone && (
            <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnGhost}`}>
              <ChatIcon size={16} />
              WhatsApp
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className={`${styles.btn} ${styles.btnGhost}`}>
              <MailIcon size={16} />
              Email
            </a>
          )}
        </div>
      </header>

      <div className={styles.detail}>
        <div className={styles.form}>
          <section className={styles.card} aria-labelledby="lead-details">
            <h2 id="lead-details" className={styles.cardTitle} style={{ marginBottom: 'var(--space-4)' }}>
              Details
            </h2>
            <dl className={styles.dl}>
              <dt>Phone</dt>
              <dd className="ltr">{lead.phone ?? '—'}</dd>
              <dt>Email</dt>
              <dd className="ltr">{lead.email ?? '—'}</dd>
              {facts.map((f) => (
                <div key={f.label} style={{ display: 'contents' }}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            {lead.message && (
              <>
                <h3 className={styles.label} style={{ margin: 'var(--space-5) 0 var(--space-2)' }}>
                  Message
                </h3>
                <p className={styles.message} dir="auto">
                  {lead.message}
                </p>
              </>
            )}
          </section>

          <section className={styles.card} aria-labelledby="lead-notes">
            <h2 id="lead-notes" className={styles.cardTitle} style={{ marginBottom: 'var(--space-4)' }}>
              Notes and history
            </h2>
            <ol className={styles.timeline}>
              {[
                ...notes.map((n) => ({ kind: 'note' as const, at: n.createdAt, ...n })),
                ...history.map((h) => ({ kind: 'event' as const, ...h })),
              ]
                .sort((a, b) => a.at.localeCompare(b.at))
                .map((item) =>
                  item.kind === 'note' ? (
                    <li key={item.id} className={styles.note}>
                      <p className={styles.noteMeta}>
                        {item.author ?? 'Former staff'} · {formatDateTime(item.at)}
                      </p>
                      <p style={{ whiteSpace: 'pre-wrap' }} dir="auto">
                        {item.body}
                      </p>
                    </li>
                  ) : (
                    <li key={item.id} className={styles.event}>
                      {item.summary} · {formatDateTime(item.at)}
                    </li>
                  ),
                )}
            </ol>
            <NoteForm leadId={lead.id} />
          </section>
        </div>

        <aside className={styles.form} aria-label="Lead actions">
          <section className={styles.card} aria-labelledby="lead-status">
            <h2 id="lead-status" className={styles.cardTitle} style={{ marginBottom: 'var(--space-3)' }}>
              Status
            </h2>
            <form key={lead.status} action={setLeadStatus.bind(null, lead.id)} className={styles.form} style={{ gap: 'var(--space-3)' }}>
              <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 'var(--space-1)' }}>
                <legend className="sr-only">Lead status</legend>
                {LEAD_STATUSES.map((s) => (
                  <label key={s} className={styles.check}>
                    <input type="radio" name="status" value={s} defaultChecked={lead.status === s} />
                    {STATUS_LABELS[s]}
                  </label>
                ))}
              </fieldset>
              <button type="submit" className={`${styles.btn}`}>
                Update status
              </button>
            </form>
          </section>

          <section className={styles.card} aria-labelledby="lead-assignee">
            <h2 id="lead-assignee" className={styles.cardTitle} style={{ marginBottom: 'var(--space-3)' }}>
              Assigned to
            </h2>
            {canAssignLead(user) ? (
              <form key={lead.assigneeId ?? 'none'} action={assignLead.bind(null, lead.id)} className={styles.form} style={{ gap: 'var(--space-3)' }}>
                <label htmlFor="assigneeId" className="sr-only">
                  Assign to
                </label>
                <select id="assigneeId" name="assigneeId" defaultValue={lead.assigneeId ?? ''} className={styles.input}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className={`${styles.btn} ${styles.btnGhost}`}>
                  Assign
                </button>
              </form>
            ) : (
              <p>{assigneeName ?? 'Unassigned'}</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
