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
