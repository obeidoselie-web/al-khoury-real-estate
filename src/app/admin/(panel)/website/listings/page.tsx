import type { Metadata } from 'next';

import { getSiteSettings } from '@/lib/data/site-store';

import styles from '../../../admin.module.css';
import { buildTextFields } from '../text-fields';
import { Section, SettingChoice, SettingToggle, TextField, WebsiteForm } from '../WebsiteForm';

export const metadata: Metadata = { title: 'Website · Listings' };

/** Small sketches for the choices: n columns, or one card of a given shape. */
const columnsSketch = (n: number) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <span key={i} style={{ width: `${Math.round(60 / n)}px`, height: '1.75rem' }} />
    ))}
  </>
);
const shapeSketch = (w: number, h: number) => <span style={{ width: `${w}px`, height: `${h}px` }} />;
const viewSketch = (list: boolean) =>
  list ? (
    <span style={{ display: 'grid', gap: 3, background: 'none' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ display: 'block', width: 58, height: 10, borderRadius: 3 }} />
      ))}
    </span>
  ) : (
    columnsSketch(3)
  );

export default async function WebsiteListingsPage() {
  const site = await getSiteSettings();
  const l = site.listings;
  const texts = await buildTextFields([
    { path: 'listings.title', label: 'Properties page title' },
    { path: 'listings.lead', label: 'Properties page introduction' },
    { path: 'card.priceOnRequest', label: 'Price on request' },
    { path: 'card.studio', label: 'Studio (0 bedrooms)' },
    { path: 'deals.sale.badge', label: 'Badge: for sale' },
    { path: 'deals.rent.badge', label: 'Badge: for rent' },
  ]);

  return (
    <WebsiteForm
      page="listings"
      settings={[
        'listings.defaultView',
        'listings.allowViewSwitch',
        'listings.columns',
        'listings.photoShape',
        'listings.showBadge',
        'listings.showFavourite',
        'listings.showType',
        'listings.showLocation',
        'listings.showFacts',
      ]}
    >
      <Section title="Properties page" hint="How the list of properties is laid out.">
        <SettingChoice
          path="listings.defaultView"
          label="Opens as"
          value={l.defaultView}
          options={[
            { value: 'grid', label: 'Grid', hint: 'Photos first, several per row', preview: viewSketch(false) },
            { value: 'list', label: 'List', hint: 'One per row, photo beside the details', preview: viewSketch(true) },
          ]}
        />
        <SettingToggle
          path="listings.allowViewSwitch"
          label="Let visitors switch between grid and list"
          hint="Their choice is remembered on their device."
          checked={l.allowViewSwitch}
        />
        <SettingChoice
          path="listings.columns"
          label="Cards per row on wide screens"
          hint="Phones and tablets show as many as fit."
          value={l.columns}
          options={[2, 3, 4, 5].map((n) => ({ value: n, label: `${n} per row`, preview: columnsSketch(n) }))}
        />
      </Section>

      <Section title="Property cards" hint="Used on the Properties page, the home page rows, similar properties and saved properties.">
        <SettingChoice
          path="listings.photoShape"
          label="Photo shape"
          value={l.photoShape}
          options={[
            { value: 'square', label: 'Square', preview: shapeSketch(36, 34) },
            { value: 'landscape', label: 'Landscape', preview: shapeSketch(48, 32) },
            { value: 'portrait', label: 'Portrait', preview: shapeSketch(32, 40) },
          ]}
        />
        <fieldset className={styles.textField}>
          <legend className={styles.label}>Show on each card</legend>
          <div className={styles.toggles}>
            <SettingToggle path="listings.showBadge" label="“For sale / For rent” badge" checked={l.showBadge} />
            <SettingToggle path="listings.showFavourite" label="Save (heart) button" checked={l.showFavourite} />
            <SettingToggle path="listings.showType" label="Property type" checked={l.showType} />
            <SettingToggle path="listings.showLocation" label="Location" checked={l.showLocation} />
            <SettingToggle path="listings.showFacts" label="Bedrooms, bathrooms and size" checked={l.showFacts} />
          </div>
          <p className={styles.hint}>The title and price are always shown. To hide a detail on one property only, use that listing’s “What the website shows”.</p>
        </fieldset>
      </Section>

      <Section title="Texts">
        {texts.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>
    </WebsiteForm>
  );
}
