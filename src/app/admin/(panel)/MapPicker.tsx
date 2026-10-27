'use client';

import 'leaflet/dist/leaflet.css';

import type { CircleMarker, Map as LeafletMap } from 'leaflet';
import { useEffect, useId, useRef, useState } from 'react';

import { parseMapLink, type MapPoint } from '@/lib/site';

import styles from '../admin.module.css';

const BEIRUT: MapPoint = { lat: 33.8938, lng: 35.5018 };

/**
 * Pick a location: click or drag on the map, paste a Google Maps / OpenStreetMap link, or type the
 * coordinates. Writes plain form fields, so the surrounding form saves it like any other input.
 * OpenStreetMap tiles; no API key.
 */
export function MapPicker({
  latName,
  lngName,
  zoomName,
  initial,
  initialZoom = 16,
  error,
}: {
  latName: string;
  lngName: string;
  zoomName?: string;
  initial: MapPoint | null;
  initialZoom?: number;
  error?: string;
}) {
  const id = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const leaflet = useRef<{ map: LeafletMap; marker: CircleMarker | null } | null>(null);
  const [point, setPoint] = useState<MapPoint | null>(initial);
  const [zoom, setZoom] = useState(initialZoom);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | null = null;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current || leaflet.current) return;
      const start = initial ?? BEIRUT;
      const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([start.lat, start.lng], initial ? initialZoom : 12);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const state: { map: LeafletMap; marker: CircleMarker | null } = { map, marker: null };
      const place = (p: MapPoint) => {
        if (state.marker) state.marker.setLatLng([p.lat, p.lng]);
        else
          state.marker = L.circleMarker([p.lat, p.lng], { radius: 10, color: '#0b0b0c', weight: 3, fillColor: '#c9a45c', fillOpacity: 1 }).addTo(map);
      };
      if (initial) place(initial);
      map.on('click', (e) => {
        const p = { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) };
        place(p);
        setPoint(p);
      });
      map.on('zoomend', () => setZoom(map.getZoom()));
      leaflet.current = state;
      // A map created while hidden (e.g. "Don't show" selected) has no size; refit when it appears.
      resize = new ResizeObserver(() => map.invalidateSize());
      resize.observe(mapRef.current);
    })();
    return () => {
      cancelled = true;
      resize?.disconnect();
      leaflet.current?.map.remove();
      leaflet.current = null;
    };
    // The map is created once; later moves go through `moveTo`.
  }, []);

  const moveTo = async (p: MapPoint) => {
    setPoint(p);
    const state = leaflet.current;
    if (!state) return;
    const L = await import('leaflet');
    if (state.marker) state.marker.setLatLng([p.lat, p.lng]);
    else state.marker = L.circleMarker([p.lat, p.lng], { radius: 10, color: '#0b0b0c', weight: 3, fillColor: '#c9a45c', fillOpacity: 1 }).addTo(state.map);
    state.map.setView([p.lat, p.lng], Math.max(state.map.getZoom(), 16));
  };

  const applyPaste = () => {
    const p = parseMapLink(paste);
    if (!p) {
      setPasteError('No coordinates found. In Google Maps, right-click the spot and copy the numbers, or share the link.');
      return;
    }
    setPasteError('');
    setPaste('');
    void moveTo(p);
  };

  return (
    <div className={styles.mapPicker}>
      <div ref={mapRef} className={styles.mapCanvas} role="application" aria-label="Map: click to place the pin" />
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor={`${id}-lat`} className={styles.label}>
            Latitude
          </label>
          <input
            id={`${id}-lat`}
            name={latName}
            inputMode="decimal"
            className={`${styles.input} ltr`}
            value={point ? String(point.lat) : ''}
            onChange={(e) => {
              const lat = Number(e.target.value);
              setPoint({ lat: Number.isFinite(lat) ? lat : 0, lng: point?.lng ?? 0 });
            }}
            onBlur={() => point && void moveTo(point)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-lng`} className={styles.label}>
            Longitude
          </label>
          <input
            id={`${id}-lng`}
            name={lngName}
            inputMode="decimal"
            className={`${styles.input} ltr`}
            value={point ? String(point.lng) : ''}
            onChange={(e) => {
              const lng = Number(e.target.value);
              setPoint({ lat: point?.lat ?? 0, lng: Number.isFinite(lng) ? lng : 0 });
            }}
            onBlur={() => point && void moveTo(point)}
            aria-invalid={error ? true : undefined}
          />
        </div>
        {zoomName && <input type="hidden" name={zoomName} value={zoom} />}
        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
          <label htmlFor={`${id}-paste`} className={styles.label}>
            Or paste a Google Maps link
          </label>
          <div className={styles.search} style={{ maxWidth: 'none' }}>
            <input
              id={`${id}-paste`}
              className={styles.input}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyPaste();
                }
              }}
              placeholder="https://maps.google.com/… or 33.8869, 35.5131"
              spellCheck={false}
            />
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={applyPaste}>
              Use
            </button>
          </div>
          {pasteError && <p className={styles.error}>{pasteError}</p>}
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.hint}>Click the map to move the pin. Zoom in for precision (the scroll wheel is off so the page scrolls normally; use + and −).</p>
    </div>
  );
}
