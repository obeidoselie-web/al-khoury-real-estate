import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PropertyGallery } from '@/components/PropertyGallery';
import { COMPANY } from '@/lib/company';
import { getListingById, getListingIds } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { formatArea, formatPrice } from '@/lib/format';
import { DEAL_LABELS, TYPE_LABELS, capitalize } from '@/lib/labels';
import type { Listing } from '@/lib/types';

import styles from './property.module.css';

interface PropertyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return (await getListingIds()).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: 'Property not found' };
  return {
    title: listing.title,
    description: listing.summary,
    openGraph: {
      title: listing.title,
      description: listing.summary,
      images: [{ url: listing.images[0]?.src ?? '/images/hero.jpg' }],
    },
  };
}

function keyFacts(listing: Listing): { label: string; value: string }[] {
  const facts = [
    { label: 'Price', value: formatPrice(listing.price, listing.deal) },
    { label: 'Type', value: capitalize(TYPE_LABELS[listing.type].singular) },
    { label: 'Listing', value: DEAL_LABELS[listing.deal].badge },
    { label: listing.type === 'land' ? 'Plot size' : 'Built area', value: formatArea(listing.areaSqm) },
  ];
  if (listing.bedrooms !== undefined) {
    facts.push({ label: 'Bedrooms', value: listing.bedrooms === 0 ? 'Studio' : String(listing.bedrooms) });
  }
  if (listing.bathrooms !== undefined) facts.push({ label: 'Bathrooms', value: String(listing.bathrooms) });
  if (listing.plotSqm !== undefined) facts.push({ label: 'Plot size', value: formatArea(listing.plotSqm) });
  if (listing.yearBuilt !== undefined) facts.push({ label: 'Year built', value: String(listing.yearBuilt) });
  return facts;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const enquireHref = `/about?property=${encodeURIComponent(listing.id)}#contact`;
  const price = formatPrice(listing.price, listing.deal);

  return (
    <article className={styles.page}>
      <div className="container">
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <ol>
            <li>
              <Link href="/listings">Properties</Link>
            </li>
            <li>
              <Link href={listingsHref({ type: listing.type })}>{TYPE_LABELS[listing.type].short}</Link>
            </li>
            <li aria-current="page" className={styles.crumbCurrent}>
              {listing.title}
            </li>
          </ol>
        </nav>

        <header className={styles.header}>
          <p className="eyebrow">
            {DEAL_LABELS[listing.deal].badge} · {capitalize(TYPE_LABELS[listing.type].singular)}
          </p>
          <h1 className={styles.title}>{listing.title}</h1>
          <p className={styles.location}>
            {listing.location.area}, {listing.location.city}
          </p>
          <p className={styles.price}>{price}</p>
        </header>

        <PropertyGallery images={listing.images} title={listing.title} />

        <div className={styles.layout}>
          <div className={styles.main}>
            <section aria-labelledby="facts-title" className={styles.section}>
              <h2 id="facts-title" className={styles.sectionTitle}>
                Key facts
              </h2>
              <dl className={styles.facts}>
                {keyFacts(listing).map((fact) => (
                  <div key={fact.label + fact.value} className={styles.fact}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="about-title" className={styles.section}>
              <h2 id="about-title" className={styles.sectionTitle}>
                About this property
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
                  Features
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
              <h2 id="contact-title" className={styles.contactTitle}>
                Interested in this property?
              </h2>
              <p className={styles.contactText}>
                An advisor can answer questions, share more photos and arrange a viewing.
              </p>
              <Link href={enquireHref} className="button">
                Send an enquiry
              </Link>
              <a href={COMPANY.phone.href} className="button button-secondary">
                Call {COMPANY.phone.display}
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
            Enquire
          </Link>
          <a href={COMPANY.phone.href} className={`button button-secondary ${styles.stickyCall}`} aria-label={`Call ${COMPANY.phone.display}`}>
            Call
          </a>
        </div>
      </div>
    </article>
  );
}
