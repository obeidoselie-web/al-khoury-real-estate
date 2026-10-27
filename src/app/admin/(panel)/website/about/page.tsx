import type { Metadata } from 'next';

import { getDictionary } from '@/i18n/dictionaries';
import { getSiteSettings } from '@/lib/data/site-store';

import styles from '../../../admin.module.css';
import { buildTextFields } from '../text-fields';
import { Section, SettingToggle, TextField, WebsiteForm } from '../WebsiteForm';

export const metadata: Metadata = { title: 'Website · About page' };

export default async function WebsiteAboutPage() {
  const site = await getSiteSettings();
  const values = getDictionary('en').about.values;
  const [intro, valueFields, contact] = await Promise.all([
    buildTextFields([
      { path: 'about.eyebrow', label: 'Small line above the title' },
      { path: 'about.title', label: 'Title', hint: 'Keep {year} — it shows the founding year.' },
      { path: 'about.lead', label: 'Introduction' },
    ]),
    buildTextFields([
      { path: 'about.valuesTitle', label: 'Section title' },
      ...values.flatMap((_, i) => [
        { path: `about.values.${i}.title`, label: `Point ${i + 1} — title` },
        { path: `about.values.${i}.text`, label: `Point ${i + 1} — text` },
      ]),
    ]),
    buildTextFields([
      { path: 'about.contactTitle', label: 'Contact title' },
      { path: 'about.contactLead', label: 'Contact introduction' },
      { path: 'about.phone', label: 'Label: phone' },
      { path: 'about.email', label: 'Label: email' },
      { path: 'about.office', label: 'Label: office' },
      { path: 'about.hours', label: 'Label: opening hours' },
      { path: 'about.directions', label: 'Map link' },
    ]),
  ]);

  return (
    <WebsiteForm page="about" settings={['about.showStats', 'about.showValues', 'about.showHours']}>
      <Section title="Introduction">
        <SettingToggle path="about.showStats" label="Show the numbers (years, properties placed, regions)" checked={site.about.showStats} />
        {intro.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>
      <Section title="How we work">
        <SettingToggle path="about.showValues" label="Show this section" checked={site.about.showValues} />
        {valueFields.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>
      <Section
        title="Contact section"
        hint={
          <>
            Phone, email, address and the office map are set under <a href="/admin/website">Contact &amp; map</a>.
          </>
        }
      >
        <div className={styles.toggles}>
          <SettingToggle path="about.showHours" label="Show opening hours" checked={site.about.showHours} />
        </div>
        {contact.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>
    </WebsiteForm>
  );
}
