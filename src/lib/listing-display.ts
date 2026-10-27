/**
 * Per-listing choices about what the public site shows. Everything is shown by default; each flag
 * hides one detail. Hidden values are removed on the server (src/lib/data/mappers.ts), so they
 * never reach the visitor's browser.
 */
export interface ListingDisplay {
  /** "Price on request" instead of the figure; also skipped by budget filters and price sorting. */
  hidePrice: boolean;
  /** Show only the city/district, not the neighbourhood or street. */
  hideArea: boolean;
  hideBedrooms: boolean;
  hideBathrooms: boolean;
  hideSize: boolean;
  hidePlot: boolean;
  hideYearBuilt: boolean;
  hideListedDate: boolean;
  hideFeatures: boolean;
  hideCalculator: boolean;
  hideViewingForm: boolean;
  hideAdvisor: boolean;
  hideSimilar: boolean;
}

export const DISPLAY_FLAGS = [
  'hidePrice',
  'hideArea',
  'hideBedrooms',
  'hideBathrooms',
  'hideSize',
  'hidePlot',
  'hideYearBuilt',
  'hideListedDate',
  'hideFeatures',
  'hideCalculator',
  'hideViewingForm',
  'hideAdvisor',
  'hideSimilar',
] as const satisfies readonly (keyof ListingDisplay)[];

/** Admin labels, grouped as they appear in the listing editor. */
export const DISPLAY_GROUPS: { title: string; flags: { key: keyof ListingDisplay; label: string; hint?: string }[] }[] = [
  {
    title: 'Price and location',
    flags: [
      { key: 'hidePrice', label: 'Hide the price', hint: 'Shows “Price on request”.' },
      { key: 'hideArea', label: 'Hide the neighbourhood', hint: 'Only the city or district is shown.' },
    ],
  },
  {
    title: 'Facts',
    flags: [
      { key: 'hideBedrooms', label: 'Hide bedrooms' },
      { key: 'hideBathrooms', label: 'Hide bathrooms' },
      { key: 'hideSize', label: 'Hide built area / plot size' },
      { key: 'hidePlot', label: 'Hide plot size (houses)' },
      { key: 'hideYearBuilt', label: 'Hide year built' },
      { key: 'hideListedDate', label: 'Hide “Listed on” date' },
    ],
  },
  {
    title: 'Page sections',
    flags: [
      { key: 'hideFeatures', label: 'Hide the features list' },
      { key: 'hideCalculator', label: 'Hide the payment calculator' },
      { key: 'hideViewingForm', label: 'Hide “Book a viewing”' },
      { key: 'hideAdvisor', label: 'Hide the advisor card' },
      { key: 'hideSimilar', label: 'Hide similar properties' },
    ],
  },
];

export function resolveDisplay(stored: Partial<ListingDisplay> | null | undefined): ListingDisplay {
  const display = {} as ListingDisplay;
  for (const flag of DISPLAY_FLAGS) display[flag] = stored?.[flag] === true;
  return display;
}

/** Only the flags that are on, for compact storage. */
export function compactDisplay(display: Partial<ListingDisplay>): Partial<ListingDisplay> {
  const out: Partial<ListingDisplay> = {};
  for (const flag of DISPLAY_FLAGS) if (display[flag]) out[flag] = true;
  return out;
}
