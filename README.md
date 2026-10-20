# Al Khoury Real Estate — website

A responsive, accessible property-listings site built with **Next.js 16 (App Router)**, **React 19** and
**TypeScript**. Visitors can browse houses, apartments, commercial properties and land to buy or rent,
view a property, and contact an advisor.

- **Home** (`/`): one primary action ("Browse properties"), shortcuts by property type, and featured listings.
- **Properties** (`/listings`): instant filtering by *Buy / Rent* and *property type*, with large tap targets and no typing. Filters are kept in the URL (`/listings?deal=rent&type=apartment`), so filtered views can be shared and bookmarked.
- **Property detail** (`/listings/[id]`): swipeable photo gallery, key facts, description, features, and a contact card (a sticky *Enquire / Call* bar on phones).
- **About & Contact** (`/about`): company story, contact details and an enquiry form. Opening it from a property (`/about?property=<id>#contact`) pre-fills the message and attaches the property reference.

---

## Getting started

Requirements: Node.js ≥ 20.9 (developed on Node 26) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build. Property pages are pre-rendered (SSG) |
| `npm start` | Serve the production build |
| `npm test` | Run the test suite once (Vitest + Testing Library) |
| `npm run test:watch` | Tests in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run images` | Regenerate the placeholder illustrations in `public/images/` |

### Environment variables

Copy `.env.example` to `.env.local`. All variables are **server-only**. None uses the `NEXT_PUBLIC_` prefix, so none can reach the browser bundle.

| Variable | Purpose |
| --- | --- |
| `CONTACT_WEBHOOK_URL` | Contact-form enquiries are POSTed here as JSON (CRM, Zapier, Make, Slack…). If it's unset, enquiries are accepted and a log line without personal data is written. |
| `SITE_URL` | Absolute site URL, used for Open Graph metadata (defaults to `http://localhost:3000`). |
| `SIMULATE_LISTINGS_ERROR` | Set to `1` in development to make the data layer throw, which lets you preview the error UI. Ignored in production. |

---

## Project structure

```
src/
  app/                          Routes (App Router)
    layout.tsx                  Root layout: skip link, header, <main>, footer, metadata
    globals.css                 Design tokens + base styles + shared primitives (.button, .badge…)
    page.tsx                    Home
    error.tsx / global-error.tsx / not-found.tsx
    listings/
      page.tsx                  Properties (reads ?deal & ?type and server-renders the filtered view)
      loading.tsx / error.tsx   Skeleton + failed-fetch state with "Try again"
      [id]/
        page.tsx                Property detail (generateStaticParams + generateMetadata)
        not-found.tsx           Unknown/withdrawn property → real 404
        loading.tsx
    about/
      page.tsx                  About & Contact
      actions.ts                Server Action: validate → sanitise → deliver enquiry
  components/
    ListingsExplorer.tsx        Client island: filter state, URL sync, live results announcement
    FilterGroup.tsx             Native radio group styled as pills (one tab stop, arrow keys)
    ListingCard.tsx / ListingGrid.tsx
    PropertyGallery.tsx         CSS scroll-snap gallery (no JS)
    ContactForm.tsx             Client island: useActionState, inline errors, focus management
    SiteHeader.tsx / NavLink.tsx / SiteFooter.tsx
    ErrorState.tsx / NotFoundState.tsx
  lib/
    types.ts                    Listing model (single source of truth for the shape of data)
    data/listings.ts            ⟵ THE data-access module (the only place pages get listings from)
    data/placeholder-listings.ts  Placeholder data
    filters.ts                  Pure filtering/URL/counting logic (fully unit-tested)
    contact.ts                  Pure validation + sanitisation (fully unit-tested)
    contact-delivery.ts         Server-only webhook delivery
    format.ts / facts.ts / labels.ts / company.ts
tests/                          Vitest + Testing Library
scripts/generate-placeholders.mjs
public/images/                  Generated placeholder illustrations
```

### What runs on the client

Pages are React Server Components. Only three small client islands ship JavaScript:

1. `ListingsExplorer` (with `FilterGroup` and the cards it renders) filters in memory, so a tap gives instant feedback without a network round trip.
2. `ContactForm` handles pending state, inline errors and focus. The form still works without JS because it posts straight to the Server Action.
3. `NavLink` sets `aria-current` on the active header link.

The gallery, sticky contact bar, cards on the home and detail pages, and every animation are pure HTML/CSS.

---

## Swapping in a real data source

All listing reads go through `src/lib/data/listings.ts`. UI components only depend on the types in
`src/lib/types.ts` and the functions exported from that module (`getListings`, `getListingSummaries`,
`getFeaturedListings`, `getListingById`, `getListingIds`).

To use an API or headless CMS:

1. **Implement `ListingsSource`** and map the remote payload to the `Listing` type:

   ```ts
   // src/lib/data/api-source.ts
   import 'server-only';
   import type { ListingsSource } from './listings';
   import type { Listing } from '../types';

   const BASE = process.env.LISTINGS_API_URL!;           // server-only secret/config
   const headers = { Authorization: `Bearer ${process.env.LISTINGS_API_TOKEN}` };

   function toListing(raw: any): Listing {               // keep all mapping in one place
     return { id: raw.slug, title: raw.title, type: raw.category, deal: raw.offer, /* … */ };
   }

   export const apiSource: ListingsSource = {
     async list() {
       const res = await fetch(`${BASE}/listings`, { headers, next: { revalidate: 300, tags: ['listings'] } });
       if (!res.ok) throw new Error(`Listings API ${res.status}`);
       return (await res.json()).items.map(toListing);
     },
     async getById(id) {
       const res = await fetch(`${BASE}/listings/${encodeURIComponent(id)}`, { headers, next: { revalidate: 300, tags: ['listings'] } });
       if (res.status === 404) return null;              // → the route renders its not-found page
       if (!res.ok) throw new Error(`Listings API ${res.status}`);
       return toListing(await res.json());
     },
   };
   ```

2. **Assign it** in `listings.ts`: `let source: ListingsSource = apiSource;`.
3. **Allow the image host** in `next.config.ts` → `images.remotePatterns` so `next/image` can optimise CMS photos.
4. Optional: trigger `revalidateTag('listings')` from a CMS webhook so new listings show up straight away.

Errors thrown by a source are wrapped in `ListingsUnavailableError`, so the route error boundaries show the
"couldn't load properties / Try again" state. Returning `null` from `getById` gives a 404.

**At scale.** Filtering runs in memory, which suits a portfolio of up to a few hundred listings. For
thousands, move filtering to the server. Add `getListings(filters)` that passes `deal`/`type` to the API,
then have the explorer navigate with `router.replace()` instead of filtering locally. `filters.ts` already parses and serialises the URL contract.

---

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `search`), a skip link, a logical heading order, and breadcrumbs on the detail page.
- Filters are **native radio groups** inside `fieldset`/`legend`. Arrow keys and screen-reader announcements ("radio button, 2 of 5, checked") come for free. Each option's result count is read out ("Apartments, 4 listings").
- The results summary (for example "3 apartments for rent") sits in a `role="status"` live region, so screen readers announce each filter change.
- Form fields have visible labels, `autocomplete`/`inputmode` hints, and `aria-invalid` + `aria-describedby` error text. After a failed submit, focus moves to the first invalid field; after success, to the confirmation.
- One consistent, high-contrast focus ring (`:focus-visible`). Tap targets are at least 44 × 44 px. Body text is 17 px.
- Colour contrast meets WCAG AA. Ratios are documented beside each token in `globals.css` (secondary text is 5.1:1, the accent is 5.6:1).
- `prefers-reduced-motion` turns off all animation and smooth scrolling. `forced-colors` keeps the selected filter visible.
- Error boundaries move focus to their heading and use `role="alert"`.

## Performance

- Server Components by default. Property pages are statically generated, and the home page is static.
- `next/image` everywhere, with responsive `sizes`, AVIF/WebP, and `priority` only for above-the-fold images.
- A system font stack (SF Pro on Apple devices), so there are no web-font downloads.
- Cards pass a trimmed `ListingSummary` to the client instead of full listings.

## Security

- **Contact form**: every field is validated and sanitised **on the server** (`src/lib/contact.ts`). That covers Unicode normalisation, removal of control and bidi-override characters and of HTML tags and angle brackets, whitespace collapsing, length limits, an email/phone format check, and an allow-list pattern for the property reference. React escapes output too. The sanitising also protects downstream systems such as CRMs and email bodies.
- A honeypot field silently drops most bot submissions.
- Secrets live only in server-only env vars. `server-only` imports make the build fail if a server module is ever imported into client code.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`, and `X-Powered-By` is disabled.
- Route params and query strings are validated against allow-lists before use.
- **Before launch** (infrastructure-dependent, so deliberately not stubbed here): add rate limiting to the contact action (at the edge/WAF or with a KV-backed limiter), and add a CSP with nonces if third-party scripts are introduced.

## Testing

```bash
npm test
```

53 tests across 7 files:

| File | Covers |
| --- | --- |
| `filters.test.ts` | URL parsing (including malicious input), serialisation round-trip, type/deal filtering, option counts, result sentences |
| `ListingsExplorer.test.tsx` | Tapping filters updates results, the live-region text and the URL; keyboard arrow-key use; empty state and recovery; Clear filters; card links |
| `ListingCard.test.tsx` | Card content and accessible price; price/area/fact formatting |
| `data-listings.test.ts` | Placeholder data integrity; sorting; summaries; by-id lookup (unknown and malformed ids); failure wrapping; swapping the source |
| `contact.test.ts` | Sanitisation, validation, the Server Action (no webhook, webhook failure, honeypot, no PII in logs) |
| `ContactForm.test.tsx` | Labels, pre-fill, inline server errors with focus, success state |
| `ErrorState.test.tsx` | Failed-fetch boundary (focus, retry) and property not-found page |

Manual checks done in a browser against the production build at 375 px (mobile), 768 px (tablet) and
1280 px (desktop): no horizontal overflow, filtering and URL sync, the property gallery and sticky contact bar,
the full contact-form round trip (server-side error and success), a real 404 status for unknown properties,
and keyboard focus order.

---

## Assumptions

- **Market and currency**: listings are in Lebanon and priced in **USD**, with rentals shown per month. Copy is in **English only**. Arabic/RTL would be a follow-up (`dir="rtl"` plus logical CSS properties, which the styles mostly already use).
- **Light theme only**, matching the Apple marketing-site look. Dark mode was not requested.
- **Filtering** is single-choice per group (one deal type, one property type). That gives the simplest phone UI and keeps URLs readable. Price, bedroom filters and sorting were left out to stay within scope.
- **Contact** is through a form that posts to a webhook, plus phone (`tel:`) and email links. No email provider or CRM is assumed.
- **Company details** in `src/lib/company.ts` (phone, email, address, founding year, stats on the About page) are **placeholders**, and the email uses the reserved `.example` domain.
- **Images** are generated illustrations, used to avoid depending on third-party image hosts and licensing. Real photography should replace them, and the alt text should then describe each photo.
- Per the brief, there are no user accounts, payments, maps or saved searches.
