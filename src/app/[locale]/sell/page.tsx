import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import { CheckIcon } from '@/components/icons';
import { ValuationForm } from '@/components/ValuationForm';
import { isLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/data/site-store';
import { alternates } from '@/lib/seo';

import styles from './sell.module.css';

type Props = PageProps<'/[locale]/sell'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getSiteDictionary(locale);
  return { title: t.sell.metaTitle, description: t.sell.metaDescription, alternates: alternates(locale, '/sell') };
}

/** For owners: why list with Al Khoury, and a free-valuation request form. */
export default async function SellPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const s = (await getSiteDictionary(locale)).sell;

  return (
    <div className={`container ${styles.page}`}>
      <section className={styles.intro} aria-labelledby="sell-title">
        <p className="kicker">{s.kicker}</p>
        <h1 id="sell-title" className={styles.title}>
          {s.title}
        </h1>
        <p className={styles.lead}>{s.lead}</p>
        <ul className={styles.benefits}>
          {s.benefits.map((benefit) => (
            <li key={benefit.title} className={styles.benefit}>
              <span className={styles.tick} aria-hidden="true">
                <CheckIcon size={14} />
              </span>
              <span>
                <strong className={styles.benefitTitle}>{benefit.title}</strong>
                <span className={styles.benefitText}>{benefit.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.photo}>
          <Image
            src="/images/photos/villa-white-path.jpg"
            alt=""
            fill
            sizes="(min-width: 960px) 40vw, 100vw"
            className={styles.photoImage}
          />
        </div>
      </section>

      <section className={styles.formCard} aria-labelledby="valuation-title">
        <h2 id="valuation-title" className={styles.formTitle}>
          {s.formTitle}
        </h2>
        <ValuationForm />
      </section>
    </div>
  );
}
