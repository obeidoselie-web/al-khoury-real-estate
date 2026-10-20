'use client';

import Image from 'next/image';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { interpolate, plural } from '@/i18n/plural';
import type { ListingImage } from '@/lib/types';

import { AllIcon, ChevronEndIcon, ChevronStartIcon, CloseIcon } from './icons';
import styles from './PropertyGallery.module.css';

interface PropertyGalleryProps {
  images: ListingImage[];
  title: string;
  locale: Locale;
  t: Pick<Dictionary, 'property'>;
}

/**
 * Photo gallery: a swipeable strip on phones and a large photo + grid on wider screens. Every photo
 * opens a full-screen viewer (native <dialog>: focus trapped, Esc closes) with previous/next, a live
 * counter, thumbnails, arrow keys and swipe. Directions follow the page, so Arabic swipes the other way.
 */
export function PropertyGallery({ images, title, locale, t }: PropertyGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerStart = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const v = t.property.viewer;
  const total = images.length;
  if (total === 0) return null;
  const more = total - 1;
  const current = images[index] ?? images[0];

  function openAt(i: number) {
    setIndex(i);
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function close() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    (triggerRefs.current[Math.min(index, 4)] ?? triggerRefs.current[0])?.focus();
  }

  const step = (delta: number) => setIndex((i) => (i + delta + total) % total);
  const direction = () => (document.documentElement.dir === 'rtl' ? -1 : 1);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') step(direction());
    else if (event.key === 'ArrowLeft') step(-direction());
    else if (event.key === 'Home') setIndex(0);
    else if (event.key === 'End') setIndex(total - 1);
    else return;
    event.preventDefault();
  }

  function onPointerUp(event: PointerEvent) {
    if (pointerStart.current === null) return;
    const dx = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > 48) step((dx < 0 ? 1 : -1) * direction());
  }

  return (
    <section className={styles.gallery} aria-label={interpolate(t.property.photosOf, { title })}>
      <div className={styles.track} tabIndex={0} role="region" aria-label={plural(locale, total, t.property.photosRegion)}>
        <ul className={styles.list} data-count={Math.min(total, 5)}>
          {images.slice(0, 5).map((image, i) => (
            <li key={`${image.src}-${i}`} className={i === 0 ? styles.lead : styles.item}>
              <button
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                type="button"
                className={styles.open}
                onClick={() => openAt(i)}
                aria-label={interpolate(v.open, { n: i + 1, total })}
              >
                <Image
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  priority={i === 0}
                  sizes={i === 0 ? '(min-width: 900px) 66vw, 90vw' : '(min-width: 900px) 33vw, 90vw'}
                  className={styles.image}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.below}>
        {more > 0 && (
          <p className={styles.hint} aria-hidden="true">
            {plural(locale, more, t.property.swipeHint)}
          </p>
        )}
        <button type="button" className={styles.showAll} onClick={() => openAt(0)}>
          <AllIcon size={16} />
          {t.property.showAllPhotos}
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className={styles.viewer}
        aria-label={`${v.label}: ${title}`}
        onKeyDown={onKeyDown}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <div className={styles.viewerBar}>
          <p className={styles.counter} aria-live="polite" aria-atomic="true">
            {interpolate(v.counter, { n: index + 1, total })}
          </p>
          <button type="button" className={styles.viewerButton} onClick={close} aria-label={v.close}>
            <CloseIcon size={20} />
          </button>
        </div>

        <figure
          className={styles.stage}
          onPointerDown={(event) => {
            pointerStart.current = event.clientX;
          }}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            pointerStart.current = null;
          }}
        >
          <div className={styles.stageImage}>
            <Image key={current.src + index} src={current.src} alt={current.alt} fill sizes="100vw" className={styles.full} />
          </div>
          <figcaption className={styles.caption}>{current.alt}</figcaption>
        </figure>

        {total > 1 && (
          <>
            <button type="button" className={`${styles.viewerButton} ${styles.prev}`} onClick={() => step(-1)} aria-label={v.previous}>
              <ChevronStartIcon size={22} />
            </button>
            <button type="button" className={`${styles.viewerButton} ${styles.next}`} onClick={() => step(1)} aria-label={v.next}>
              <ChevronEndIcon size={22} />
            </button>
            <ol className={styles.thumbs}>
              {images.map((image, i) => (
                <li key={`${image.src}-thumb-${i}`}>
                  <button
                    type="button"
                    className={styles.thumb}
                    onClick={() => setIndex(i)}
                    aria-label={interpolate(v.open, { n: i + 1, total })}
                    aria-current={i === index ? 'true' : undefined}
                  >
                    <Image src={image.src} alt="" width={96} height={64} sizes="96px" className={styles.thumbImage} />
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </dialog>
    </section>
  );
}
