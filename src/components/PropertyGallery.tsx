import Image from 'next/image';

import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate, plural } from '@/i18n/plural';
import type { ListingImage } from '@/lib/types';

import styles from './PropertyGallery.module.css';

interface PropertyGalleryProps {
  images: ListingImage[];
  title: string;
  locale: Locale;
  t: Pick<Dictionary, 'property'>;
}

/**
 * Zero-JS gallery: a swipeable scroll-snap strip on phones, a lead image + grid on larger screens.
 * The strip is a focusable, labelled region so keyboard users can scroll it with arrow keys.
 * Scroll-snap follows the document direction, so the strip swipes naturally in RTL too.
 */
export function PropertyGallery({ images, title, locale, t }: PropertyGalleryProps) {
  if (images.length === 0) return null;
  const more = images.length - 1;

  return (
    <section className={styles.gallery} aria-label={interpolate(t.property.photosOf, { title })}>
      <div className={styles.track} tabIndex={0} role="region" aria-label={plural(locale, images.length, t.property.photosRegion)}>
        <ul className={styles.list} data-count={Math.min(images.length, 5)}>
          {images.slice(0, 5).map((image, index) => (
            <li key={`${image.src}-${index}`} className={index === 0 ? styles.lead : styles.item}>
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                priority={index === 0}
                sizes={index === 0 ? '(min-width: 900px) 66vw, 90vw' : '(min-width: 900px) 33vw, 90vw'}
                className={styles.image}
              />
            </li>
          ))}
        </ul>
      </div>
      {more > 0 && (
        <p className={styles.hint} aria-hidden="true">
          {plural(locale, more, t.property.swipeHint)}
        </p>
      )}
    </section>
  );
}
