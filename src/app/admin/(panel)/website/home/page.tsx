import type { Metadata } from 'next';

import { getSiteSettings } from '@/lib/data/site-store';
import { DEFAULT_SITE } from '@/lib/site';
import { PROPERTY_TYPES } from '@/lib/types';

import styles from '../../../admin.module.css';
import { HeroImageForm } from '../HeroImageForm';
import { buildTextFields } from '../text-fields';
import { Section, SettingChoice, SettingInput, SettingToggle, TextField, WebsiteForm } from '../WebsiteForm';

export const metadata: Metadata = { title: 'Website · Home page' };

/** Page, text and button colours of each theme, for the swatches. */
const THEME_SWATCHES = [
  { value: 'system', label: 'Follow device', hint: 'Light or dark, as the visitor’s phone or computer is set', colors: ['#ffffff', '#121212', '#c9a45c'] },
  { value: 'light', label: 'Light', hint: 'White, ink and gold', colors: ['#ffffff', '#222222', '#c9a45c'] },
  { value: 'dark', label: 'Dark', hint: 'Charcoal and gold', colors: ['#121212', '#f7f7f7', '#d9b56a'] },
  { value: 'ivory', label: 'Ivory', hint: 'Warm cream and gold — luxury, Mediterranean', colors: ['#fbf8f3', '#2a241d', '#c9a45c'] },
  { value: 'cedar', label: 'Cedar', hint: 'Sage and cedar green — calm, natural', colors: ['#f8f9f6', '#1c2a21', '#2f5d43'] },
  { value: 'coastal', label: 'Coastal', hint: 'White and navy — trust, clarity', colors: ['#ffffff', '#13233a', '#1d4e89'] },
  { value: 'midnight', label: 'Midnight', hint: 'Navy and gold — premium dark', colors: ['#0d1626', '#eef2f7', '#d9b56a'] },
];

const swatch = (colors: string[]) => (
  <>
    {colors.map((color, i) => (
      <span key={i} style={{ width: i === 0 ? 30 : 14, height: i === 0 ? '2.5rem' : '1.5rem', background: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
    ))}
  </>
);

export default async function WebsiteHomePage() {
  const site = await getSiteSettings();
  const [hero, sections, stats, brand, rows] = await Promise.all([
    buildTextFields([
      { path: 'home.heroEyebrow', label: 'Small line above the headline' },
      { path: 'home.heroTitle', label: 'Headline' },
      { path: 'home.heroLead', label: 'Sub-headline' },
    ]),
    buildTextFields([
      { path: 'home.spotlightEyebrow', label: 'Spotlight label' },
      { path: 'home.viewProperty', label: 'Spotlight button' },
      { path: 'home.featuredTitle', label: 'Featured row title' },
      { path: 'home.rowShowAll', label: '“Show all” link' },
    ]),
    buildTextFields([
      { path: 'home.trustLabel', label: 'Numbers section name (for screen readers)' },
      { path: 'about.stats.years', label: 'Label: years in business' },
      { path: 'about.stats.placed', label: 'Label: properties placed' },
      { path: 'about.stats.regions', label: 'Label: regions covered' },
      { path: 'home.trustAdvisor', label: 'Fourth figure (big text)' },
      { path: 'home.trustAdvisorText', label: 'Fourth figure (label)' },
    ]),
    buildTextFields([
      { path: 'home.brandEyebrow', label: 'Small line', hint: 'Keep {year} — it shows the founding year.' },
      { path: 'home.brandTitle', label: 'Title' },
      { path: 'home.brandText', label: 'Text', hint: 'Keep {years} — it shows the years in business.' },
      { path: 'home.brandCta', label: 'Button' },
    ]),
    buildTextFields(
      PROPERTY_TYPES.flatMap((type) => [
        { path: `types.${type}.short`, label: `${type[0].toUpperCase()}${type.slice(1)} row — title` },
        { path: `types.${type}.blurb`, label: `${type[0].toUpperCase()}${type.slice(1)} row — subtitle` },
      ]),
    ),
  ]);

  const settings = [
    'appearance.defaultTheme',
    'hero.showSearch',
    'home.showSpotlight',
    'home.showFeatured',
    'home.showTypeRows',
    'home.showStats',
    'home.showBrandBand',
    'stats.placed',
    'stats.regions',
  ];

  return (
    <div className={styles.form}>
      <HeroImageForm image={site.hero.image} isDefault={site.hero.image.src === DEFAULT_SITE.hero.image.src} />
      <WebsiteForm page="home" settings={settings}>
        <Section
          title="Colour theme"
          hint="What visitors see until they choose their own in Appearance & language (their choice is kept on their device)."
        >
          <SettingChoice
            path="appearance.defaultTheme"
            label="Website theme"
            value={site.appearance.defaultTheme}
            options={THEME_SWATCHES.map((theme) => ({ value: theme.value, label: theme.label, hint: theme.hint, preview: swatch(theme.colors) }))}
          />
        </Section>

        <Section title="Hero" hint="The big photo at the top of the home page.">
          <SettingToggle path="hero.showSearch" label="Show the search bar on the photo" checked={site.hero.showSearch} />
          {hero.map((field) => (
            <TextField key={field.path} field={field} />
          ))}
        </Section>

        <Section title="Sections" hint="Untick a section to hide it from the home page.">
          <div className={styles.toggles}>
            <SettingToggle path="home.showSpotlight" label="Spotlight (the first featured property, large)" checked={site.home.showSpotlight} />
            <SettingToggle path="home.showFeatured" label="Featured properties row" checked={site.home.showFeatured} />
            <SettingToggle path="home.showTypeRows" label="Rows by property type" checked={site.home.showTypeRows} />
            <SettingToggle path="home.showStats" label="Al Khoury in numbers" checked={site.home.showStats} />
            <SettingToggle path="home.showBrandBand" label="Black-and-gold brand band" checked={site.home.showBrandBand} />
          </div>
          <p className={styles.hint}>Which properties are featured is set on each listing (“Feature on the home page”).</p>
          {sections.map((field) => (
            <TextField key={field.path} field={field} />
          ))}
        </Section>

        <Section title="Al Khoury in numbers" hint="Also shown on the About page. Years in business come from the founding year (Contact & map).">
          <div className={styles.fields}>
            <SettingInput path="stats.placed" label="Properties placed" value={site.stats.placed} type="number" />
            <SettingInput path="stats.regions" label="Regions covered" value={site.stats.regions} type="number" />
          </div>
          {stats.map((field) => (
            <TextField key={field.path} field={field} />
          ))}
        </Section>

        <Section title="Brand band">
          {brand.map((field) => (
            <TextField key={field.path} field={field} />
          ))}
        </Section>

        <Section title="Property rows">
          {rows.map((field) => (
            <TextField key={field.path} field={field} />
          ))}
        </Section>
      </WebsiteForm>
    </div>
  );
}
