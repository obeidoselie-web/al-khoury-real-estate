'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { ChevronEndIcon, ChevronStartIcon } from './icons';
import styles from './ListingRow.module.css';

interface RowScrollerProps {
  heading: ReactNode;
  regionLabel: string;
  previousLabel: string;
  nextLabel: string;
  children: ReactNode;
}

/**
 * Horizontal scroll row with previous/next buttons. The row itself is a native scroll-snap strip,
 * so touch, trackpad and keyboard scrolling work without these buttons; they are an enhancement
 * for mouse users and are hidden on small screens. Direction-aware for RTL.
 */
export function RowScroller({ heading, regionLabel, previousLabel, nextLabel, children }: RowScrollerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // scrollLeft is negative in RTL in modern browsers; the magnitude is what matters.
    const position = Math.abs(el.scrollLeft);
    setCanPrevious(position > 4);
    setCanNext(position < max - 4);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [update]);

  function scroll(step: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.getAttribute('data-motion') === 'reduce';
    el.scrollBy({ left: step * rtl * el.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <>
      <div className={styles.header}>
        {heading}
        <div className={styles.arrows}>
          <button type="button" className={styles.arrow} onClick={() => scroll(-1)} disabled={!canPrevious} aria-label={previousLabel}>
            <ChevronStartIcon size={14} />
          </button>
          <button type="button" className={styles.arrow} onClick={() => scroll(1)} disabled={!canNext} aria-label={nextLabel}>
            <ChevronEndIcon size={14} />
          </button>
        </div>
      </div>
      <div ref={trackRef} className={styles.track} tabIndex={0} role="region" aria-label={regionLabel}>
        {children}
      </div>
    </>
  );
}
