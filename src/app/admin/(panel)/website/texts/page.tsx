import type { Metadata } from 'next';
import Link from 'next/link';

import { getDictionary } from '@/i18n/dictionaries';
import { SECTION_LABELS, flattenTexts, getAt, labelForPath } from '@/lib/content/texts';
import { getOverrides } from '@/lib/data/site-store';

import styles from '../../../admin.module.css';
import { buildTextFields } from '../text-fields';
import { Section, TextField, WebsiteForm } from '../WebsiteForm';

export const metadata: Metadata = { title: 'Website · All texts' };

/**
 * Every string on the public site, by section, with search. Placeholders like {count} are filled in
 * by the site and must stay; the editor refuses to save a text that drops one.
 */
export default async function AllTextsPage({ searchParams }: PageProps<'/admin/website/texts'>) {
  const params = await searchParams;
  const en = getDictionary('en');
  const ar = getDictionary('ar');
  const sections = Object.keys(en);
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const edited = params.edited === '1';
  const section = typeof params.section === 'string' && sections.includes(params.section) ? params.section : q || edited ? '' : 'home';

  const [enOver, arOver] = await Promise.all([getOverrides('en'), getOverrides('ar')]);
  const editedPaths = new Set([...Object.keys(enOver), ...Object.keys(arOver)]);
  const needle = q.toLowerCase();
  const paths = flattenTexts(en)
    .map((entry) => entry.path)
    .filter((path) => !section || path.startsWith(`${section}.`))
    .filter((path) => !edited || editedPaths.has(path))
    .filter((path) => {
      if (!needle) return true;
      const haystack = [path, labelForPath(path), getAt(en, path), getAt(ar, path), enOver[path], arOver[path]]
        .flat()
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  const shown = paths.slice(0, 120);
  const fields = await buildTextFields(shown);
  const grouped = Object.groupBy(fields, (field) => field.path.split('.')[0]);

  const href = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ section, q, edited: edited ? '1' : undefined, ...patch })) if (v) sp.set(k, v);
    return `/admin/website/texts?${sp.toString()}`;
  };

  return (
    <div className={styles.form}>
      <div className={styles.toolbar}>
        <form role="search" className={styles.search} action="/admin/website/texts">
          <label htmlFor="text-search" className="sr-only">
            Search texts
          </label>
          <input id="text-search" name="q" type="search" defaultValue={q} placeholder="Search in English or Arabic" className={styles.input} />
          <button type="submit" className={`${styles.btn} ${styles.btnGhost}`}>
            Search
          </button>
        </form>
        <Link href={href({ edited: edited ? undefined : '1', section: undefined })} className={`${styles.btn} ${styles.btnGhost}`} aria-pressed={edited}>
          {edited ? 'Show all' : `Edited only (${editedPaths.size})`}
        </Link>
      </div>

      <nav aria-label="Text sections" className={styles.chips}>
        {sections.map((key) => (
          <Link key={key} href={href({ section: key, q: undefined, edited: undefined })} className={styles.chip} aria-current={section === key ? 'page' : undefined}>
            {SECTION_LABELS[key] ?? key}
          </Link>
        ))}
      </nav>

      {fields.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>No texts match.</div>
      ) : (
        <WebsiteForm page={section ? `texts: ${section}` : 'texts'}>
          {paths.length > shown.length && (
            <p className={`${styles.banner} ${styles.bannerInfo}`}>
              Showing the first {shown.length} of {paths.length}. Search or pick a section to narrow it down.
            </p>
          )}
          {Object.entries(grouped).map(([key, group]) => (
            <Section key={key} title={SECTION_LABELS[key] ?? key}>
              {group!.map((field) => (
                <TextField key={field.path} field={field} />
              ))}
            </Section>
          ))}
        </WebsiteForm>
      )}
    </div>
  );
}
