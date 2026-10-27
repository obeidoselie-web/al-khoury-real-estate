import type { Metadata } from 'next';

import { getSiteSettings } from '@/lib/data/site-store';
import { SOCIAL_NETWORKS } from '@/lib/site';

import styles from '../../admin.module.css';
import { buildTextFields } from './text-fields';
import { OfficeMapField, Section, SettingInput, SettingToggle, TextField, WebsiteForm } from './WebsiteForm';

export const metadata: Metadata = { title: 'Website · Contact & map' };

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export default async function WebsiteContactPage() {
  const site = await getSiteSettings();
  const [company, office, messages] = await Promise.all([
    buildTextFields([
      { path: 'company.name', label: 'Company name' },
      { path: 'company.tagline', label: 'Tagline (footer)' },
    ]),
    buildTextFields([
      { path: 'company.address', label: 'Office address' },
      { path: 'company.hours.0.days', label: 'Opening hours 1 — days' },
      { path: 'company.hours.0.time', label: 'Opening hours 1 — time' },
      { path: 'company.hours.1.days', label: 'Opening hours 2 — days' },
      { path: 'company.hours.1.time', label: 'Opening hours 2 — time' },
    ]),
    buildTextFields([
      { path: 'nav.whatsappHello', label: 'WhatsApp greeting', hint: 'Pre-filled when a visitor taps the WhatsApp button.' },
      { path: 'property.whatsappMessage', label: 'WhatsApp message from a property page', hint: 'Keep {title} and {url}.' },
      { path: 'nav.legal', label: 'Footer note' },
    ]),
  ]);

  const settings = [
    'contact.phone',
    'contact.whatsapp',
    'contact.email',
    'contact.founded',
    'header.showPhone',
    'whatsappButton.show',
    'office.showMap',
    'office.lat',
    'office.lng',
    'office.zoom',
    ...SOCIAL_NETWORKS.map((n) => `social.${n}`),
  ];

  return (
    <WebsiteForm page="contact" settings={settings}>
      <Section title="Contact details" hint="Used in the header, footer, About page, property pages and error pages.">
        <div className={styles.fields}>
          <SettingInput path="contact.phone" label="Office phone" value={site.contact.phone} type="tel" ltr hint="As it should appear, e.g. +961 1 234 567." />
          <SettingInput path="contact.whatsapp" label="WhatsApp number" value={site.contact.whatsapp} type="tel" ltr />
          <SettingInput path="contact.email" label="Email" value={site.contact.email} type="email" ltr />
          <SettingInput path="contact.founded" label="Founded in (year)" value={site.contact.founded} type="number" hint="Drives “Since …” and years in business." />
        </div>
        <div className={styles.toggles}>
          <SettingToggle path="header.showPhone" label="Show the phone number in the header" checked={site.header.showPhone} />
          <SettingToggle path="whatsappButton.show" label="Show the floating WhatsApp button" checked={site.whatsappButton.show} />
        </div>
      </Section>

      <Section title="Office location" hint="Shown as a map on the About page, with a “Get directions” link.">
        <SettingToggle path="office.showMap" label="Show the office map" checked={site.office.showMap} />
        <OfficeMapField lat={site.office.lat} lng={site.office.lng} zoom={site.office.zoom} />
        {office.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>

      <Section title="Company" hint="The name appears in the header logo text, page titles and the footer.">
        {company.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>

      <Section title="Social media" hint="Leave empty to hide. Links appear in the footer under “Follow us”.">
        <div className={styles.fields2}>
          {SOCIAL_NETWORKS.map((network) => (
            <SettingInput
              key={network}
              path={`social.${network}`}
              label={SOCIAL_LABELS[network]}
              value={site.social[network]}
              type="url"
              ltr
            />
          ))}
        </div>
      </Section>

      <Section title="Messages">
        {messages.map((field) => (
          <TextField key={field.path} field={field} />
        ))}
      </Section>
    </WebsiteForm>
  );
}
