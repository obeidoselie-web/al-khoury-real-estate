import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PropertyGallery } from '@/components/PropertyGallery';
import { LOCALES, isLocale, localizedPath, type Locale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';
import { COMPANY } from '@/lib/company';
import { getListingById, getListingIds } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { formatArea, formatPlace, formatPrice } from '@/lib/format';
import { alternates } from '@/lib/seo';
import type { Listing } from '@/lib/types';

import styles from './property.module.css';

type Props = PageProps<'/[locale]/listings/[id]'>;

export async function generateStaticParams() {
  const ids = await getListingIds();
  return LOCALES.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const listing = await getListingById(id, locale);
  if (!listing) return { title: t.meta.propertyNotFound };
  return {
    title: listing.title,
    description: listing.summary,
    alternates: alternates(locale, `/listings/${listing.id}`),
    openGraph: {
      title: listing.title,
      description: listing.summary,
      images: [{ url: listing.images[0]?.src ?? '/images/hero.jpg' }],
    },
  };
}

function keyFacts(listing: Listing, locale: Locale, t: Dictionary): { label: string; value: string }[] {
  const p = t.property;
  const facts = [
    { label: p.price, value: formatPrice(listing.price, listing.deal, locale, t) },
    { label: p.type, value: t.types[listing.type].label },
    { label: p.listing, value: t.deals[listing.deal].badge },
    { label: listing.type === 'land' ? p.plotSize : p.builtArea, value: formatArea(listing.areaSqm, locale, t) },
  ];
  if (listing.bedrooms !== undefined) {
    facts.push({ label: p.bedrooms, value: listing.bedrooms === 0 ? t.card.studio : String(listing.bedrooms) });
  }
  if (listing.bathrooms !== undefined) facts.push({ label: p.bathrooms, value: String(listing.bathrooms) });
  if (listing.plotSqm !== undefined) facts.push({ label: p.plotSize, value: formatArea(listing.plotSqm, locale, t) });
  if (listing.yearBuilt !== undefined) facts.push({ label: p.yearBuilt, value: String(listing.yearBuilt) });
  return facts;
}

export default async function PropertyPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const listing = await getListingById(id, locale);
  if (!listing) notFound();

  const enquireHref = `${localizedPath(locale, '/about')}?property=${encodeURIComponent(listing.id)}#contact`;
  const price = formatPrice(listing.price, listing.deal, locale, t);
  const p = t.property;
  const phone = <span className="ltr">{COMPANY.phone.display}</span>;
  const [callBefore, callAfter = ''] = p.call.split('{phone}');

  return (
    <article className={styles.page}>
      <div className={`container ${styles.narrow}`}>
        <nav aria-label={t.nav.breadcrumb} className={styles.breadcrumb}>
          <ol>
            <li>
              <Link href={localizedPath(locale, '/listings')}>{t.nav.properties}</Link>
            </li>
            <li>
              <Link href={listingsHref(locale, { type: listing.type })}>{t.types[listing.type].short}</Link>
            </li>
            <li aria-current="page" className={styles.crumbCurrent}>
              {listing.title}
            </li>
          </ol>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">
            {t.deals[listing.deal].badge} · {t.types[listing.type].label}
          </p>
          <h1 className={styles.title}>{listing.title}</h1>
          <p className={styles.location}>{formatPlace(listing.location, locale)}</p>
        </header>

        <PropertyGallery images={listing.images} title={listing.title} locale={locale} t={t} />

        <div className={styles.layout}>
          <div className={styles.main}>
            <section aria-labelledby="facts-title" className={styles.section}>
              <h2 id="facts-title" className={styles.sectionTitle}>
                {p.factsTitle}
              </h2>
              <dl className={styles.facts}>
                {keyFacts(listing, locale, t).map((fact) => (
                  <div key={fact.label + fact.value} className={styles.fact}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="about-title" className={styles.section}>
              <h2 id="about-title" className={styles.sectionTitle}>
                {p.aboutTitle}
              </h2>
              <p className={styles.summary}>{listing.summary}</p>
              {listing.description.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>

            {listing.features.length > 0 && (
              <section aria-labelledby="features-title" className={styles.section}>
                <h2 id="features-title" className={styles.sectionTitle}>
                  {p.featuresTitle}
                </h2>
                <ul className={styles.features}>
                  {listing.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className={styles.aside} aria-labelledby="contact-title">
            <div className={styles.contactCard}>
              <p className={styles.cardPrice}>{price}</p>
              <h2 id="contact-title" className={styles.contactTitle}>
                {p.interestedTitle}
              </h2>
              <p className={styles.contactText}>{p.interestedText}</p>
              <Link href={enquireHref} className="button">
                {p.enquire}
              </Link>
              <a href={COMPANY.phone.href} className="button button-secondary">
                {callBefore}
                {phone}
                {callAfter}
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Phone-only sticky action bar keeps the contact action one thumb-tap away. */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <p className={styles.stickyPrice}>{price}</p>
          <Link href={enquireHref} className="button">
            {p.enquireShort}
          </Link>
          <a
            href={COMPANY.phone.href}
            className={`button button-secondary ${styles.stickyCall}`}
            aria-label={interpolate(p.call, { phone: COMPANY.phone.display })}
          >
            {p.callShort}
          </a>
        </div>
      </div>
    </article>
  );
}
