/**
 * The Al Khoury "lk" mark: rising building bars under a roofline, ending in the K.
 * Vector redraw of the brand logo (Option 1), so it stays crisp at any size and needs no image request.
 * Keep in sync with src/app/icon.svg and scripts/generate-brand.mjs.
 */
export const MARK_VIEWBOX = '0 0 100 84';
export const MARK_SOLID_PATH =
  'M5 80V72.24L9.6 68.01V80ZM12.6 80V65.25L17.2 61.02V80ZM20.2 80V58.26L24.8 54.02V80ZM27.8 80V51.26L32.4 47.03V80Z' +
  'M35.4 80V44.27L40 40.04V80ZM43 80V37.28L47.6 33.05V80ZM52 80V22L61 13.72V80Z' +
  'M60 47.9L89 22H99L60 59.9ZM60 57L67 50L99 80H86Z';
export const MARK_LINE_PATH = 'M2 69L46 28.52V22.52L51 17.92';

export const GOLD_STOPS = [
  { offset: 0, color: '#f3dc9e' },
  { offset: 0.45, color: '#d2ab5e' },
  { offset: 1, color: '#9c7130' },
];

interface BrandMarkProps {
  /** Unique per page instance — SVG gradient ids are document-global. */
  id: string;
  className?: string;
  title?: string;
}

export function BrandMark({ id, className, title }: BrandMarkProps) {
  const gradient = `${id}-gold`;
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradient} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="84">
          {GOLD_STOPS.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>
      <path d={MARK_SOLID_PATH} fill={`url(#${gradient})`} />
      <path d={MARK_LINE_PATH} fill="none" stroke={`url(#${gradient})`} strokeWidth="1.6" />
    </svg>
  );
}
