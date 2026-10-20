import Image from 'next/image';

import type { ListingImage } from '@/lib/types';

import styles from './PropertyGallery.module.css';

/**
 * Zero-JS gallery: a swipeable scroll-snap strip on phones, a lead image + grid on larger screens.
 * The strip is a focusable, labelled region so keyboard users can scroll it with arrow keys.
 */
export function PropertyGallery({ images, title }: { images: ListingImage[]; title: string }) {
  if (images.length === 0) return null;

  return (
    <section className={styles.gallery} aria-label={`Photos of ${title}`}>
      <div className={styles.track} tabIndex={0} role="region" aria-label={`${images.length} photos, scroll to see more`}>
        <ul className={styles.list}>
          {images.map((image, index) => (
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
      <p className={styles.hint} aria-hidden="true">
        Swipe for {images.length - 1} more {images.length - 1 === 1 ? 'photo' : 'photos'}
      </p>
    </section>
  );
}
