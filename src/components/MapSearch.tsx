'use client';

import 'leaflet/dist/leaflet.css';

import type { LayerGroup, Map as LeafletMap, Marker } from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { plural } from '@/i18n/plural';
import { listingPrice } from '@/lib/format';
import type { ListingDisplaySettings } from '@/lib/site';
import type { ListingSummary } from '@/lib/types';

import { CloseIcon } from './icons';
import { ListingCard } from './ListingCard';
import styles from './MapSearch.module.css';

type Box = { south: number; west: number; north: number; east: number };

const compact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });

/** Pins closer than this (px) are grouped into one bubble. */
const CLUSTER_RADIUS = 44;

/**
 * Greedy screen-space clustering: each point joins the first group whose first point is within
 * `radius` pixels, else starts a new one. Plenty for an agency's catalogue; recomputed on zoom.
 */
export function clusterPoints<P extends { x: number; y: number }>(points: P[], radius: number): { members: P[] }[] {
  const clusters: { x: number; y: number; members: P[] }[] = [];
  for (const point of points) {
    const home = clusters.find((c) => Math.hypot(c.x - point.x, c.y - point.y) <= radius);
    if (home) home.members.push(point);
    else clusters.push({ x: point.x, y: point.y, members: [point] });
  }
  return clusters.map(({ members }) => ({ members }));
}

/** Short pin label: "$780K", "$1.3K"; price-on-request listings get no figure. */
export function pinLabel(listing: Pick<ListingSummary, 'price' | 'priceOnRequest'>): string {
  return listing.priceOnRequest ? '•' : compact.format(listing.price);
}

export function inBox(point: { lat: number; lng: number }, box: Box): boolean {
  return point.lat >= box.south && point.lat <= box.north && point.lng >= box.west && point.lng <= box.east;
}

/**
 * Pins that share a spot (several listings in one neighbourhood) are fanned out in a small circle
 * so each stays clickable. Display only; the data is untouched.
 */
export function spreadPins<T extends { id: string; map?: { lat: number; lng: number } }>(items: T[]): Map<string, { lat: number; lng: number }> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!item.map) continue;
    const key = `${item.map.lat.toFixed(4)},${item.map.lng.toFixed(4)}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const out = new Map<string, { lat: number; lng: number }>();
  for (const group of groups.values()) {
    group.forEach((item, index) => {
      const { lat, lng } = item.map!;
      if (group.length === 1) return out.set(item.id, { lat, lng });
      const angle = (2 * Math.PI * index) / group.length;
      out.set(item.id, { lat: lat + 0.0025 * Math.sin(angle), lng: lng + 0.0032 * Math.cos(angle) });
    });
  }
  return out;
}

interface MapSearchProps {
  listings: ListingSummary[];
  locale: Locale;
  t: Dictionary;
  display: ListingDisplaySettings;
}

/**
 * Search by map: the results beside an OpenStreetMap map with a price pin per property.
 * Hovering a card highlights its pin and the other way round; a pin opens a preview card.
 * "Search as I move the map" narrows the list to what's in view. The list stays the accessible
 * way through the results; the map is an extra.
 */
export default function MapSearch({ listings, locale, t, display }: MapSearchProps) {
  const l = t.listings;
  const pinned = useMemo(() => listings.filter((listing) => listing.map), [listings]);
  const positions = useMemo(() => spreadPins(pinned), [pinned]);
  const missing = listings.length - pinned.length;

  const [searchAsMove, setSearchAsMove] = useState(true);
  const [box, setBox] = useState<Box | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Bumped after each redraw so pin highlighting re-applies to the new markers.
  const [drawn, setDrawn] = useState(0);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, Marker>());

  const visible = searchAsMove && box ? pinned.filter((listing) => inBox(positions.get(listing.id)!, box)) : pinned;
  const selectedListing = pinned.find((listing) => listing.id === selected) ?? null;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView([33.89, 35.5], 10);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const readBox = () => {
        const b = map.getBounds();
        setBox({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
      };
      map.on('moveend', readBox);
      map.on('click', () => setSelected(null));
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      readBox();
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)draw the pins whenever the results change, and frame them.
  // (Re)draw the pins whenever the results change or the map zooms; frame them when results change.
  useEffect(() => {
    let cancelled = false;
    let detach: (() => void) | undefined;
    (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;
      const layer = layerRef.current;
      if (cancelled || !ready || !map || !layer) return;

      const pinIcon = (html: string) => L.divIcon({ className: styles.pinAnchor, html, iconSize: undefined });

      const draw = () => {
        layer.clearLayers();
        markersRef.current.clear();
        const points = pinned.map((listing) => {
          const p = positions.get(listing.id)!;
          const xy = map.latLngToContainerPoint([p.lat, p.lng]);
          return { id: listing.id, x: xy.x, y: xy.y, lat: p.lat, lng: p.lng };
        });
        for (const cluster of clusterPoints(points, CLUSTER_RADIUS)) {
          if (cluster.members.length === 1) {
            const only = cluster.members[0];
            const listing = pinned.find((item) => item.id === only.id)!;
            const marker = L.marker([only.lat, only.lng], {
              icon: pinIcon(
                `<span class="${styles.pin}" data-por="${listing.priceOnRequest ? 'true' : 'false'}">${pinLabel(listing)}</span>`,
              ),
              keyboard: true,
              title: `${listing.title} — ${listingPrice(listing, locale, t)}`,
              alt: listing.title,
              riseOnHover: true,
            });
            marker.on('click', (event) => {
              L.DomEvent.stopPropagation(event);
              setSelected(listing.id);
            });
            marker.on('keypress', (event) => {
              const key = (event.originalEvent as KeyboardEvent).key;
              if (key === 'Enter' || key === ' ') setSelected(listing.id);
            });
            marker.addTo(layer);
            markersRef.current.set(listing.id, marker);
            continue;
          }
          // Several pins too close to read: one bubble with the count; it zooms in to them.
          const bounds = L.latLngBounds(cluster.members.map((m) => [m.lat, m.lng] as [number, number]));
          const marker = L.marker(bounds.getCenter(), {
            icon: pinIcon(`<span class="${styles.pin} ${styles.cluster}">${cluster.members.length}</span>`),
            keyboard: true,
            title: plural(locale, cluster.members.length, t.listings.showResults),
            riseOnHover: true,
          });
          const zoomIn = () => map.fitBounds(bounds.pad(0.5), { maxZoom: Math.max(map.getZoom() + 2, 13) });
          marker.on('click', (event) => {
            L.DomEvent.stopPropagation(event);
            zoomIn();
          });
          marker.on('keypress', (event) => {
            const key = (event.originalEvent as KeyboardEvent).key;
            if (key === 'Enter' || key === ' ') zoomIn();
          });
          marker.addTo(layer);
          for (const member of cluster.members) markersRef.current.set(member.id, marker);
        }
        setDrawn((n) => n + 1);
      };

      if (pinned.length > 0) {
        const bounds = L.latLngBounds(
          pinned.map((listing) => {
            const p = positions.get(listing.id)!;
            return [p.lat, p.lng] as [number, number];
          }),
        );
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: false });
      }
      draw();
      map.on('zoomend', draw);
      detach = () => map.off('zoomend', draw);
    })();
    return () => {
      cancelled = true;
      detach?.();
    };
  }, [ready, pinned, positions, locale, t]);

  // Highlight the hovered / selected pin.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement()?.querySelector<HTMLElement>(`.${styles.pin}`);
      if (!el) continue;
      el.dataset.state = id === selected ? 'selected' : id === hovered ? 'hover' : '';
      marker.setZIndexOffset(id === selected || id === hovered ? 1000 : 0);
    }
  }, [hovered, selected, drawn]);

  const fitAll = async () => {
    const L = await import('leaflet');
    if (!mapRef.current || pinned.length === 0) return;
    mapRef.current.fitBounds(
      L.latLngBounds(pinned.map((listing) => [positions.get(listing.id)!.lat, positions.get(listing.id)!.lng] as [number, number])),
      { padding: [48, 48], maxZoom: 14 },
    );
  };

  const approximate = pinned.some((listing) => listing.map && !listing.map.exact);

  return (
    <div className={styles.split}>
      <div className={styles.results}>
        <div className={styles.bar}>
          <p className={styles.count} role="status" aria-live="polite">
            {plural(locale, visible.length, l.mapInArea)}
          </p>
          <label className={styles.toggle}>
            <input type="checkbox" checked={searchAsMove} onChange={(e) => setSearchAsMove(e.target.checked)} />
            {l.searchAsMove}
          </label>
        </div>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p>{l.mapEmpty}</p>
            <button type="button" className="button button-secondary" onClick={fitAll}>
              {l.mapFitAll}
            </button>
          </div>
        ) : (
          <ul className={styles.list} aria-label={l.matching}>
            {visible.map((listing, index) => (
              <li
                key={listing.id}
                onMouseEnter={() => setHovered(listing.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(listing.id)}
                onBlur={() => setHovered(null)}
              >
                <ListingCard listing={listing} locale={locale} t={t} priority={index < 2} headingLevel="h2" options={display} />
              </li>
            ))}
          </ul>
        )}

        {(missing > 0 || approximate) && (
          <div className={styles.notes}>
            {approximate && <p>{l.mapApproximate}</p>}
            {missing > 0 && <p>{plural(locale, missing, l.mapMissing)}</p>}
          </div>
        )}
      </div>

      <div className={styles.mapColumn}>
        <div ref={mapEl} className={styles.map} dir="ltr" role="region" aria-label={l.mapRegion} />
        {selectedListing && (
          <div className={styles.preview}>
            <button type="button" className={styles.previewClose} onClick={() => setSelected(null)} aria-label={t.settings.close}>
              <CloseIcon size={16} />
            </button>
            <ListingCard listing={selectedListing} locale={locale} t={t} view="list" headingLevel="h2" options={display} />
          </div>
        )}
      </div>
    </div>
  );
}
