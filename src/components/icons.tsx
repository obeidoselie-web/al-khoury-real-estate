import type { SVGProps } from 'react';

import type { PropertyType } from '@/lib/types';

/**
 * Outlined, monochrome UI icons (24px grid, 1.6px stroke, currentColor), drawn for this site.
 * Decorative by default: the accompanying text always names the control.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.4}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </Svg>
);

export const GlobeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </Svg>
);

/** Points to the inline end (right in LTR); add className="icon-directional" to mirror in RTL. */
export const ArrowEndIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ChevronEndIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const ChevronStartIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
);

export const AllIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Svg>
);

export const HouseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </Svg>
);

export const ApartmentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21" />
    <path d="M3 21h18" />
    <path d="M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15" />
  </Svg>
);

export const CommercialIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5 5.5 4h13L20 9.5" />
    <path d="M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.1 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1 2.5 2.6 2.5S20 10.9 20 9.5" />
    <path d="M5.5 12v8.5h13V12" />
    <path d="M10 20.5V16h4v4.5" />
  </Svg>
);

export const LandIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m2.5 19 6-8.5 4 5.5 2.5-3 6.5 6" />
    <path d="M2.5 19h19" />
    <circle cx="17" cy="6.5" r="2" />
  </Svg>
);

export const PROPERTY_TYPE_ICONS: Record<PropertyType | 'all', (p: IconProps) => React.JSX.Element> = {
  all: AllIcon,
  house: HouseIcon,
  apartment: ApartmentIcon,
  commercial: CommercialIcon,
  land: LandIcon,
};

export const BedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 18.5V6.5M3 15h18v3.5M21 15v-3.5a2.5 2.5 0 0 0-2.5-2.5H11v6" />
    <circle cx="7" cy="11.5" r="2" />
  </Svg>
);

export const BathIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12h17v2.5a4.5 4.5 0 0 1-4.5 4.5H8a4.5 4.5 0 0 1-4.5-4.5V12Z" />
    <path d="M6 12V5.8A1.8 1.8 0 0 1 9.4 5M7 19l-1 2M17 19l1 2" />
  </Svg>
);

export const AreaIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </Svg>
);

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
);

export const PlotIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 8 6-3 6 3 6-3v11l-6 3-6-3-6 3Z" />
    <path d="M9 5v11M15 8v11" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const TagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-8.1 8.1a1 1 0 0 1-1.4 0l-7.4-7.4a1 1 0 0 1-.3-.7Z" />
    <circle cx="8.3" cy="8.3" r="1.4" />
  </Svg>
);

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.6 3.5h-2a1.6 1.6 0 0 0-1.6 1.8 17 17 0 0 0 15.7 15.7 1.6 1.6 0 0 0 1.8-1.6v-2a1.6 1.6 0 0 0-1.3-1.6l-3-.6a1.6 1.6 0 0 0-1.5.5l-1 1.2a13 13 0 0 1-5.3-5.3l1.2-1a1.6 1.6 0 0 0 .5-1.5l-.6-3a1.6 1.6 0 0 0-1.6-1.3Z" />
  </Svg>
);
