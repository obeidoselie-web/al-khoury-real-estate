'use client';

import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react';

import type { ListingRow } from '@/db/schema';
import { slugify } from '@/lib/admin/slug';
import { DISPLAY_GROUPS } from '@/lib/listing-display';
import { DEAL_TYPES, PROPERTY_TYPES, REGIONS } from '@/lib/types';

import styles from '../../admin.module.css';
import { MapPicker } from '../MapPicker';
import { useKeepValuesSubmit } from '../useKeepValuesSubmit';
import type { ListingFormState } from './actions';

type Action = (state: ListingFormState, form: FormData) => Promise<ListingFormState>;

interface Props {
  action: Action;
  listing: ListingRow | null;
  staff: { id: string; name: string }[];
  regionLabels: Record<string, string>;
  canAssign: boolean;
  canFeature: boolean;
  /** Footer extras (e.g. "View on site", delete). */
  aside?: ReactNode;
}

const TYPE_LABELS = { house: 'House', apartment: 'Apartment', commercial: 'Commercial', land: 'Land' } as const;
const STATUS_HELP = {
  draft: 'Draft — only staff can see it.',
  published: 'Published — live on the website in both languages.',
  archived: 'Archived — hidden from the site, kept for records.',
} as const;

/** Listing editor: facts, then English and Arabic text side by side. Works without JavaScript too. */
export function ListingForm({ action, listing, staff, regionLabels, canAssign, canFeature, aside }: Props) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' });
  const errors = state.fieldErrors ?? {};
  const isNew = listing === null;
  const [type, setType] = useState<string>(listing?.type ?? 'apartment');
  const [status, setStatus] = useState<string>(listing?.status ?? 'draft');
  const [mapMode, setMapMode] = useState<string>(listing?.mapMode ?? 'off');
  const [titleEn, setTitleEn] = useState(listing?.titleEn ?? '');
  const [slug, setSlug] = useState(listing?.id ?? '');
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const bannerRef = useRef<HTMLParagraphElement>(null);
  const onSubmit = useKeepValuesSubmit(formAction);

  useEffect(() => {
    if (state.status !== 'idle') bannerRef.current?.focus();
  }, [state]);

  const isLand = type === 'land';
  const v = (key: keyof ListingRow) => {
    // After a failed save, show what was typed (React resets the form to these defaults).
    const echoed = state.values?.[key];
    if (echoed !== undefined) return echoed;
    const value = listing?.[key];
    if (Array.isArray(value)) return value.join(key.startsWith('description') ? '\n\n' : '\n');
    return value === null || value === undefined ? '' : String(value);
  };

  const field = (
    name: string,
    label: string,
    input: ReactNode,
    { hint, optional }: { hint?: string; optional?: boolean } = {},
  ) => (
    <div className={styles.field}>
      <label htmlFor={`f-${name}`} className={styles.label}>
        {label} {optional && <span className={styles.optional}>(optional)</span>}
      </label>
      {input}
      {hint && (
        <p id={`f-${name}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {errors[name] && (
        <p id={`f-${name}-error`} className={styles.error}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  const described = (name: string, hint?: boolean) =>
    [hint && `f-${name}-hint`, errors[name] && `f-${name}-error`].filter(Boolean).join(' ') || undefined;

  const text = (name: string, opts: { dir?: 'rtl'; required?: boolean; inputMode?: 'numeric'; hint?: boolean } = {}) => ({
    id: `f-${name}`,
    name,
    className: styles.input,
    dir: opts.dir,
    lang: opts.dir === 'rtl' ? 'ar' : undefined,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': described(name, opts.hint),
    inputMode: opts.inputMode,
  });

  return (
    <form action={formAction} onSubmit={onSubmit} className={styles.form} noValidate>
      {state.status !== 'idle' && state.message && (
        <p
          ref={bannerRef}
          tabIndex={-1}
          key={state.savedAt ?? state.message}
          role={state.status === 'error' ? 'alert' : 'status'}
          className={`${styles.banner} ${state.status === 'error' ? styles.bannerError : styles.bannerOk}`}
        >
          {state.message}
        </p>
      )}

      <section className={styles.section} aria-labelledby="sec-basics">
        <div className={styles.sectionHead}>
          <h2 id="sec-basics" className={styles.sectionTitle}>
            Basics
          </h2>
        </div>
        <div className={styles.fields}>
          {field(
            'status',
            'Status',
            <select {...text('status', { hint: true })} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>,
            { hint: STATUS_HELP[status as keyof typeof STATUS_HELP] },
          )}
          {field(
            'type',
            'Property type',
            <select {...text('type')} value={type} onChange={(e) => setType(e.target.value)}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>,
          )}
          {field(
            'deal',
            'For',
            <select {...text('deal')} defaultValue={v('deal') || 'sale'}>
              {DEAL_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d === 'sale' ? 'Sale' : 'Rent'}
                </option>
              ))}
            </select>,
          )}
          {field(
            'region',
            'Region',
            <select {...text('region')} defaultValue={v('region') || 'beirut'}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {regionLabels[r] ?? r}
                </option>
              ))}
            </select>,
          )}
          {field(
            'price',
            'Price (USD)',
            <input {...text('price', { inputMode: 'numeric', hint: true })} defaultValue={v('price')} autoComplete="off" />,
            { hint: 'Monthly rent for rentals.' },
          )}
          {canAssign
            ? field(
                'advisorId',
                'Advisor',
                <select {...text('advisorId')} defaultValue={v('advisorId')}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>,
              )
            : null}
        </div>
        <div className={styles.checks}>
          <label className={styles.check}>
            <input type="checkbox" name="verified" defaultChecked={state.values ? state.values.verified === 'on' : (listing?.verified ?? false)} />
            Title deed verified
          </label>
          {canFeature && (
            <label className={styles.check}>
              <input type="checkbox" name="featured" defaultChecked={state.values ? state.values.featured === 'on' : (listing?.featured ?? false)} />
              Feature on the home page
            </label>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sec-facts">
        <div className={styles.sectionHead}>
          <h2 id="sec-facts" className={styles.sectionTitle}>
            Facts
          </h2>
        </div>
        <div className={styles.fields}>
          {field(
            'areaSqm',
            isLand ? 'Plot size (m²)' : 'Built area (m²)',
            <input {...text('areaSqm', { inputMode: 'numeric' })} defaultValue={v('areaSqm')} autoComplete="off" />,
          )}
          {!isLand &&
            field('bedrooms', 'Bedrooms', <input {...text('bedrooms', { inputMode: 'numeric', hint: true })} defaultValue={v('bedrooms')} />, {
              optional: true,
              hint: '0 for a studio.',
            })}
          {!isLand &&
            field('bathrooms', 'Bathrooms', <input {...text('bathrooms', { inputMode: 'numeric' })} defaultValue={v('bathrooms')} />, {
              optional: true,
            })}
          {!isLand &&
            field('plotSqm', 'Plot size (m²)', <input {...text('plotSqm', { inputMode: 'numeric' })} defaultValue={v('plotSqm')} />, {
              optional: true,
            })}
          {!isLand &&
            field('yearBuilt', 'Year built', <input {...text('yearBuilt', { inputMode: 'numeric' })} defaultValue={v('yearBuilt')} />, {
              optional: true,
            })}
          {field('listedAt', 'Listed on', <input {...text('listedAt')} type="date" defaultValue={v('listedAt')} />, {
            optional: isNew,
          })}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sec-display">
        <div className={styles.sectionHead}>
          <h2 id="sec-display" className={styles.sectionTitle}>
            What the website shows
          </h2>
          <p className={styles.sectionHint}>Everything is shown unless you hide it. Hidden details are never sent to visitors’ browsers.</p>
        </div>
        {DISPLAY_GROUPS.map((group) => (
          <fieldset key={group.title} className={styles.textField}>
            <legend className={styles.label}>{group.title}</legend>
            <div className={styles.toggles}>
              {group.flags.map((flag) => (
                <label key={flag.key} className={styles.toggle}>
                  <input type="checkbox" name={`display.${flag.key}`} defaultChecked={listing?.display?.[flag.key] === true} />
                  <span>
                    <span className={styles.toggleLabel}>{flag.label}</span>
                    {flag.hint && <span className={styles.hint}>{flag.hint}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="sec-map">
        <div className={styles.sectionHead}>
          <h2 id="sec-map" className={styles.sectionTitle}>
            Location on the map
          </h2>
          <p className={styles.sectionHint}>
            “Approximate” shows the neighbourhood (about 1 km) without a pin, and the exact point never leaves the server.
          </p>
        </div>
        <fieldset className={styles.checks} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">Map</legend>
          {(
            [
              ['off', 'Don’t show a map'],
              ['approximate', 'Approximate area'],
              ['exact', 'Exact location (with pin)'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={styles.check}>
              <input type="radio" name="mapMode" value={value} checked={mapMode === value} onChange={() => setMapMode(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <div hidden={mapMode === 'off'}>
          <MapPicker
            latName="lat"
            lngName="lng"
            initial={listing?.lat != null && listing?.lng != null ? { lat: listing.lat, lng: listing.lng } : null}
            error={errors.lat}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="sec-text">
        <div className={styles.sectionHead}>
          <h2 id="sec-text" className={styles.sectionTitle}>
            Text
          </h2>
          <p className={styles.sectionHint}>English and Arabic side by side. Both are required to publish.</p>
        </div>
        <div className={styles.fields2}>
          {field(
            'titleEn',
            'Title (English)',
            <input
              {...text('titleEn')}
              value={titleEn}
              onChange={(e) => {
                setTitleEn(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />,
          )}
          {field('titleAr', 'Title (Arabic)', <input {...text('titleAr', { dir: 'rtl' })} defaultValue={v('titleAr')} />)}
          {field('areaEn', 'Area (English)', <input {...text('areaEn')} defaultValue={v('areaEn')} />)}
          {field('areaAr', 'Area (Arabic)', <input {...text('areaAr', { dir: 'rtl' })} defaultValue={v('areaAr')} />)}
          {field('cityEn', 'City or district (English)', <input {...text('cityEn')} defaultValue={v('cityEn')} />)}
          {field('cityAr', 'City or district (Arabic)', <input {...text('cityAr', { dir: 'rtl' })} defaultValue={v('cityAr')} />)}
          {field('summaryEn', 'Summary (English)', <input {...text('summaryEn', { hint: true })} defaultValue={v('summaryEn')} />, {
            hint: 'One sentence for cards and search results.',
          })}
          {field('summaryAr', 'Summary (Arabic)', <input {...text('summaryAr', { dir: 'rtl' })} defaultValue={v('summaryAr')} />)}
          {field(
            'descriptionEn',
            'Description (English)',
            <textarea {...text('descriptionEn', { hint: true })} rows={7} defaultValue={v('descriptionEn')} />,
            { hint: 'Leave a blank line between paragraphs.' },
          )}
          {field(
            'descriptionAr',
            'Description (Arabic)',
            <textarea {...text('descriptionAr', { dir: 'rtl' })} rows={7} defaultValue={v('descriptionAr')} />,
          )}
          {field('featuresEn', 'Features (English)', <textarea {...text('featuresEn', { hint: true })} rows={5} defaultValue={v('featuresEn')} />, {
            optional: true,
            hint: 'One per line.',
          })}
          {field('featuresAr', 'Features (Arabic)', <textarea {...text('featuresAr', { dir: 'rtl' })} rows={5} defaultValue={v('featuresAr')} />, {
            optional: true,
          })}
        </div>
        {field(
          'id',
          'Web address',
          <input
            {...text('id', { hint: true })}
            value={slug}
            disabled={!isNew}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            autoComplete="off"
            spellCheck={false}
          />,
          { hint: isNew ? `/listings/${slug || 'your-listing'} — made from the English title; edit if you like.` : 'Fixed once created, so shared links keep working.' },
        )}
      </section>

      <div className={styles.formBar}>
        <div className={styles.actions}>{aside}</div>
        <button type="submit" className={`${styles.btn} ${styles.btnGold}`} disabled={pending}>
          {pending ? 'Saving…' : isNew ? 'Create listing' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
