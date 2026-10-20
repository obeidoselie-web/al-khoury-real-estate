import type { Metadata } from 'next';
import Link from 'next/link';

import { ContactForm } from '@/components/ContactForm';
import { COMPANY } from '@/lib/company';
import { getListingById } from '@/lib/data/listings';

import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'About & Contact',
  description: `About ${COMPANY.name} and how to get in touch with an advisor.`,
};

interface AboutPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VALUES = [
  {
    title: 'Local knowledge',
    text: 'Our advisors live where they work, from Beirut to Batroun to the Bekaa.',
  },
  {
    title: 'Straight answers',
    text: 'Clear pricing, verified title deeds and no surprises at signing.',
  },
  {
    title: 'One advisor, start to finish',
    text: 'The same person guides you from first viewing to handing over the keys.',
  },
];

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const params = await searchParams;
  const propertyParam = Array.isArray(params.property) ? params.property[0] : params.property;
  // A failed lookup must never block someone from contacting us.
  const property = propertyParam ? await getListingById(propertyParam).catch(() => null) : null;
  const yearsActive = new Date().getFullYear() - COMPANY.founded;

  return (
    <>
      <section className={`container ${styles.intro}`} aria-labelledby="about-title">
        <p className="eyebrow">About us</p>
        <h1 id="about-title" className={styles.title}>
          A family firm, helping people find their place since {COMPANY.founded}.
        </h1>
        <p className={styles.lead}>
          {COMPANY.name} sells and rents houses, apartments, commercial property and land across Lebanon. We’re a small
          team of advisors who believe buying or renting should feel clear and calm — not complicated.
        </p>
        <dl className={styles.stats}>
          <div>
            <dt>Years in business</dt>
            <dd>{yearsActive}+</dd>
          </div>
          <div>
            <dt>Properties placed</dt>
            <dd>2,400+</dd>
          </div>
          <div>
            <dt>Regions covered</dt>
            <dd>6</dd>
          </div>
        </dl>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <h2 id="values-title" className="section-heading">
            How we work.
          </h2>
          <ul className={styles.values}>
            {VALUES.map((value) => (
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
              Talk to an advisor.
            </h2>
            <p className={styles.contactLead}>Send a message and we’ll reply within one working day, or reach us directly.</p>
            <dl className={styles.details}>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={COMPANY.phone.href}>{COMPANY.phone.display}</a>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
                </dd>
              </div>
              <div>
                <dt>Office</dt>
                <dd>
                  <address>
                    {COMPANY.address.lines.map((line) => (
                      <span key={line} className={styles.addressLine}>
                        {line}
                      </span>
                    ))}
                  </address>
                </dd>
              </div>
              <div>
                <dt>Opening hours</dt>
                <dd>
                  {COMPANY.hours.map((slot) => (
                    <span key={slot.days} className={styles.addressLine}>
                      {slot.days}: {slot.time}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <div className={styles.formCard}>
            {property && (
              <p className={styles.regarding}>
                About: <Link href={`/listings/${property.id}`}>{property.title}</Link>
              </p>
            )}
            <ContactForm propertyId={property?.id} propertyTitle={property?.title} />
          </div>
        </div>
      </section>
    </>
  );
}
