import { directionsHref, osmEmbedUrl, type MapPoint } from '@/lib/site';

import { ExternalIcon, PinIcon } from './icons';
import styles from './LocationMap.module.css';

/**
 * An OpenStreetMap embed (no API key, no tracking script) with a link out to the visitor's maps app.
 * Approximate locations get no pin, a wider view and the link opens the neighbourhood only.
 */
export function LocationMap({
  point,
  zoom = 16,
  exact = true,
  title,
  linkLabel,
  note,
}: {
  point: MapPoint;
  zoom?: number;
  exact?: boolean;
  title: string;
  linkLabel: string;
  note?: string;
}) {
  return (
    <figure className={styles.map}>
      <div className={styles.frame}>
        <iframe
          src={osmEmbedUrl(point, exact ? zoom : Math.min(zoom, 14), exact)}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={styles.iframe}
        />
      </div>
      <figcaption className={styles.caption}>
        {note && (
          <span className={styles.note}>
            <PinIcon size={16} />
            {note}
          </span>
        )}
        <a href={directionsHref(point)} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {linkLabel}
          <ExternalIcon size={14} />
        </a>
      </figcaption>
    </figure>
  );
}
