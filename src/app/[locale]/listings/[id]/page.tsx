import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdvisorCard } from '@/components/AdvisorCard';
import { FavouriteButton } from '@/components/FavouriteButton';
import { Highlights } from '@/components/Highlights';
import { CalendarIcon, ChatIcon, CheckIcon, PhoneIcon, PinIcon } from '@/components/icons';
import { ListingRow } from '@/components/ListingRow';
import { LocationMap } from '@/components/LocationMap';
import { PaymentCalculator } from '@/components/PaymentCalculator';
import { PropertyGallery } from '@/components/PropertyGallery';
import { ShareButton } from '@/components/ShareButton';
import { ViewingForm } from '@/components/ViewingForm';
import { LOCALES, LOCALE_META, isLocale, localizedPath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate } from '@/i18n/plural';
import { siteUrl } from '@/lib/company';
import { getAdvisorForListing } from '@/lib/data/db-source';
import { getSiteDictionary, getSiteSettings } from '@/lib/data/site-store';
import { telHref, whatsappHref } from '@/lib/site';
import { getListingById, getListingIds, getSimilarListings } from '@/lib/data/listings';
import { listingsHref } from '@/lib/filters';
import { formatArea, formatPlace, listingPrice } from '@/lib/format';
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
  const t = await getSiteDictionary(locale);
  const listing = await getListingById(id, locale);
  if (!listing) return { title: t.meta.propertyNotFound };
  return {
    title: listing.title,
    description: listing.summary,
    alternates: alternates(locale, `/listings/${listing.id}`),
    openGraph: {
      title: listing.title,
      description: listing.summary,
      images: [{ url: listing.images[0]?.src ?? '/images/photos/hero-villa-dusk.jpg' }],
    },
  };
}

function keyFacts(listing: Listing, locale: Locale, t: Dictionary): { label: string; value: string }[] {
  const p = t.property;
  const facts = [
    { label: p.price, value: listingPrice(listing, locale, t) },
    { label: p.type, value: t.types[listing.type].label },
    { label: p.listing, value: t.deals[listing.deal].badge },
  ];
  if (listing.areaSqm !== undefined) {
    facts.push({ label: listing.type === 'land' ? p.plotSize : p.builtArea, value: formatArea(listing.areaSqm, locale, t) });
  }
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
  const [t, site, listing] = await Promise.all([getSiteDictionary(locale), getSiteSettings(), getListingById(id, locale)]);
  if (!listing) notFound();
  const show = {
    listedDate: !listing.display?.hideListedDate,
    calculator: !listing.display?.hideCalculator && listing.deal === 'sale' && !listing.priceOnRequest,
    viewing: !listing.display?.hideViewingForm,
    advisor: !listing.display?.hideAdvisor,
    similar: !listing.display?.hideSimilar,
  };
  const officePhone = site.contact.phone;

  const enquireHref = `${localizedPath(locale, '/about')}?property=${encodeURIComponent(listing.id)}#contact`;
  const price = listingPrice(listing, locale, t);
  const p = t.property;
  const phone = <span className="ltr">{officePhone}</span>;
  const [callBefore, callAfter = ''] = p.call.split('{phone}');
  const whatsappMessage = interpolate(p.whatsappMessage, {
    title: listing.title,
    url: `${siteUrl()}${localizedPath(locale, `/listings/${listing.id}`)}`,
  });
  const whatsapp = whatsappHref(whatsappMessage, site.contact.whatsapp);
  const [advisor, similar] = await Promise.all([
    show.advisor ? getAdvisorForListing(listing) : null,
    show.similar ? getSimilarListings(listing, locale, 6) : [],
  ]);
  // Without the viewing form, the "Book a viewing" actions go to the enquiry form instead.
  const viewingHref = show.viewing ? '#book-viewing' : enquireHref;
  const listedOn = new Intl.DateTimeFormat(LOCALE_META[locale].intl, { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${listing.listedAt}T00:00:00Z`),
  );

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
          <ul className={styles.badges}>
            {listing.verified && (
              <li className={styles.verified} title={p.verifiedHint}>
                <CheckIcon size={14} />
                {p.verified}
              </li>
            )}
            {show.listedDate && (
              <li className={styles.listed}>
                <CalendarIcon size={14} />
                {interpolate(p.listedOn, { date: listedOn })}
              </li>
            )}
          </ul>
          <div className={styles.subhead}>
            <p className={styles.location}>
              <PinIcon size={18} />
              {formatPlace(listing.location, locale)}
            </p>
            <div className={styles.actions}>
              <ShareButton title={listing.title} />
              <FavouriteButton id={listing.id} title={listing.title} t={t} variant="page" />
            </div>
          </div>
        </header>

        <PropertyGallery images={listing.images} title={listing.title} locale={locale} t={{ property: p }} />

        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.section}>
              <Highlights listing={listing} locale={locale} t={t} label={p.highlights} />
            </div>
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

            {listing.map && (
              <section aria-labelledby="map-title" className={styles.section}>
                <h2 id="map-title" className={styles.sectionTitle}>
                  {p.mapTitle}
                </h2>
                <LocationMap
                  point={listing.map}
                  exact={listing.map.exact}
                  title={p.mapFrameTitle}
                  linkLabel={p.openInMaps}
                  note={listing.map.exact ? undefined : p.mapApproximate}
                />
              </section>
            )}

            {show.calculator && (
              <div className={styles.section}>
                <PaymentCalculator price={listing.price} />
              </div>
            )}

            {show.viewing && (
              <section id="book-viewing" aria-labelledby="viewing-title" className={styles.section}>
                <h2 id="viewing-title" className={styles.sectionTitle}>
                  {p.viewing.title}
                </h2>
                <p className={styles.paragraph}>{p.viewing.lead}</p>
                <ViewingForm propertyId={listing.id} />
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
              <a href={viewingHref} className="button">
                <CalendarIcon size={18} />
                {p.bookViewing}
              </a>
              <Link href={enquireHref} className="button button-secondary">
                {p.enquire}
              </Link>
              <a href={whatsapp} className="button button-secondary" target="_blank" rel="noopener noreferrer">
                <ChatIcon size={20} />
                {p.whatsappLabel}
              </a>
              <a href={telHref(officePhone)} className="button button-secondary">
                {callBefore}
                {phone}
                {callAfter}
              </a>
            </div>
            {show.advisor && advisor && <AdvisorCard advisor={advisor} locale={locale} t={t} whatsappMessage={whatsappMessage} />}
          </aside>
        </div>
      </div>

      {similar.length > 0 && (
        <div className={`container ${styles.narrow} ${styles.similar}`}>
          <ListingRow
            id="similar"
            title={p.similarTitle}
            href={listingsHref(locale, { type: listing.type })}
            listings={similar}
            locale={locale}
            t={t}
          />
        </div>
      )}

      {/* Phone-only sticky action bar keeps the contact action one thumb-tap away. */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <p className={styles.stickyPrice}>{price}</p>
          <a href={viewingHref} className="button">
            {p.bookViewing}
          </a>
          {/* Secondary actions are icon buttons here so the price keeps its room on a 375px phone. */}
          <a
            href={telHref(officePhone)}
            className={`button button-secondary ${styles.stickyIcon}`}
            aria-label={interpolate(p.call, { phone: officePhone })}
          >
            <PhoneIcon size={22} />
          </a>
          <a
            href={whatsapp}
            className={`button button-secondary ${styles.stickyIcon}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.whatsappLabel}
          >
            <ChatIcon size={22} />
          </a>
        </div>
      </div>
    </article>
  );
}
