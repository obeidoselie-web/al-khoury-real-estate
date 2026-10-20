import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactForm } from '@/components/ContactForm';
import { isLocale, localizedPath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { formatNumber, interpolate } from '@/i18n/plural';
import { COMPANY } from '@/lib/company';
import { getListingById } from '@/lib/data/listings';
import { alternates } from '@/lib/seo';

import styles from './about.module.css';

type Props = PageProps<'/[locale]/about'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.meta.aboutTitle, description: t.meta.aboutDescription, alternates: alternates(locale, '/about') };
}

export default async function AboutPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const a = t.about;

  const query = await searchParams;
  const propertyParam = Array.isArray(query.property) ? query.property[0] : query.property;
  // A failed lookup must never block someone from contacting us.
  const property = propertyParam ? await getListingById(propertyParam, locale).catch(() => null) : null;
  const yearsActive = new Date().getFullYear() - COMPANY.founded;

  return (
    <>
      <section className={`container ${styles.intro}`} aria-labelledby="about-title">
        <div className={styles.introText}>
          <p className="eyebrow">{a.eyebrow}</p>
          <h1 id="about-title" className={styles.title}>
            {interpolate(a.title, { year: COMPANY.founded })}
          </h1>
          <p className={styles.lead}>{a.lead}</p>
          <dl className={styles.stats}>
            <div>
              <dt>{a.stats.years}</dt>
              <dd>{formatNumber(yearsActive, locale)}+</dd>
            </div>
            <div>
              <dt>{a.stats.placed}</dt>
              <dd>{formatNumber(2400, locale)}+</dd>
            </div>
            <div>
              <dt>{a.stats.regions}</dt>
              <dd>{formatNumber(6, locale)}</dd>
            </div>
          </dl>
        </div>
        <Image
          src="/images/brand/al-khoury-brand.webp"
          alt={a.brandImageAlt}
          width={1000}
          height={1000}
          priority
          sizes="(min-width: 960px) 26rem, 80vw"
          className={styles.brandImage}
        />
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <h2 id="values-title" className="section-heading">
            {a.valuesTitle}
          </h2>
          <ul className={styles.values}>
            {a.values.map((value) => (
              <li key={value.title} className={styles.value}>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueText}>{value.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className={`section ${styles.contactSection}`} aria-labelledby="contact-title">
        <div className={`container ${styles.contactLayout}`}>
          <div className={styles.contactInfo}>
            <h2 id="contact-title" className="section-heading">
              {a.contactTitle}
            </h2>
            <p className={styles.contactLead}>{a.contactLead}</p>
            <dl className={styles.details}>
              <div>
                <dt>{a.phone}</dt>
                <dd>
                  <a href={COMPANY.phone.href} className="ltr">
                    {COMPANY.phone.display}
                  </a>
                </dd>
              </div>
              <div>
                <dt>{a.email}</dt>
                <dd>
                  <a href={`mailto:${COMPANY.email}`} className="ltr">
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>{a.office}</dt>
                <dd>
                  <address>
                    {t.company.address.map((line) => (
                      <span key={line} className={styles.addressLine}>
                        {line}
                      </span>
                    ))}
                  </address>
                </dd>
              </div>
              <div>
                <dt>{a.hours}</dt>
                <dd>
                  {t.company.hours.map((slot) => (
                    <span key={slot.days} className={styles.addressLine}>
                      {slot.days}: <span className="ltr">{slot.time}</span>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <div className={styles.formCard}>
            {property && (
              <p className={styles.regarding}>
                {a.regarding} <Link href={localizedPath(locale, `/listings/${property.id}`)}>{property.title}</Link>
              </p>
            )}
            {/* Keyed by locale so switching language resets any half-filled default message. */}
            <ContactForm key={locale} propertyId={property?.id} propertyTitle={property?.title} />
          </div>
        </div>
      </section>
    </>
  );
}
