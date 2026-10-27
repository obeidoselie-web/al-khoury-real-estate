# Al Khoury Real Estate — website

A responsive, accessible property-listings site built with **Next.js 16 (App Router)**, **React 19** and
**TypeScript**, in **English and Arabic** (full right-to-left layout). Visitors can browse houses, apartments,
commercial properties and land to buy or rent, view a property, and contact an advisor. They can also choose
light or dark mode, a larger text size, increased contrast and reduced motion.

Every URL starts with a language: `/en/…` or `/ar/…`. A bare URL such as `/` or `/listings` redirects to the
visitor's language (see [Languages](#languages-english--arabic)).

- **Home** (`/en`, `/ar`): one primary action ("Browse properties"), shortcuts by property type, and featured listings.
- **Properties** (`/en/listings`): instant filtering by *Buy / Rent*, *property type* and *region*, plus a **Filters** panel (budget, bedrooms, size) and **sorting** (newest, price, size). Everything is kept in the URL (`/en/listings?deal=sale&minBeds=3&sort=price-desc`), so filtered views can be shared and bookmarked.
- **Property detail** (`/en/listings/[id]`): photo gallery with a **full-screen viewer**, *Title deed verified* and *Listed on* badges, key facts, description, features, a **payment calculator** (sale listings), a **Book a viewing** form, the responsible **advisor** with call/WhatsApp, *Share* and *Save*, and **similar properties**. Phones get a sticky *Book a viewing / Call / WhatsApp* bar.
- **List your property** (`/en/sell`): why list with Al Khoury and a free-valuation request form for owners.
- **Saved properties** (`/en/saved`): every card and property page has a heart; saved properties are listed here and counted in the header (see [Saved properties, sharing and WhatsApp](#saved-properties-sharing-and-whatsapp)).
- **About & Contact** (`/en/about`): company story, contact details and an enquiry form. Opening it from a property (`/en/about?property=<id>#contact`) pre-fills the message and attaches the property reference.
- **Appearance & language** (the half-circle button in the header): language, theme, text size, contrast and motion.
- **Admin** (`/admin`, staff only): dashboard, listings editor with photo uploads, leads inbox, team & advisor profiles (see [Admin](#admin)).

---

## Getting started

Requirements: Node.js ≥ 20.9 (developed on Node 26) and npm.

```bash
npm install
npm run db:seed      # create data/alkhoury.db, load the placeholder catalogue, create the first admin
npm run dev          # http://localhost:3000 — admin at http://localhost:3000/admin
```

The first admin is `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`. If those are unset, the seed uses
`admin@alkhoury.example` and writes a generated password to `data/admin-credentials.txt` (gitignored). Sign in,
change it under **My account**, then delete that file.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server (Turbopack). Applies pending database migrations first |
| `npm run build` | Production build (migrates first). Home and property pages are pre-rendered for both languages and refreshed whenever the admin changes a listing |
| `npm start` | Serve the production build |
| `npm run db:seed` | Migrate, then load the placeholder listings and advisors into an empty database and create the first admin (safe to re-run) |
| `npm run db:migrate` | Apply pending migrations from `drizzle/` |
| `npm run db:generate` | After editing `src/db/schema.ts`: write a new SQL migration to `drizzle/` |
| `npm test` | Run the test suite once (Vitest + Testing Library) |
| `npm run test:watch` | Tests in watch mode |
| `npm run typecheck` | `tsc --noEmit` (run `npx next typegen` first on a fresh clone) |
| `npm run photos -- <empty-dir>` | Re-download and optimise the stock photos listed in `src/lib/data/photos.json` into `public/images/photos/` |
| `npm run brand` | Regenerate the favicon, Apple touch icon and `public/brand/mark.svg` from `BrandMark.tsx` |

### Environment variables

Copy `.env.example` to `.env.local`. All variables are **server-only**. None uses the `NEXT_PUBLIC_` prefix, so none can reach the browser bundle.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Database location. Default `file:data/alkhoury.db` (local SQLite). Use a `libsql://…` URL for Turso. |
| `DATABASE_AUTH_TOKEN` | Turso auth token (not needed for a local file). |
| `UPLOAD_DIR` | Where uploaded listing photos are stored. Default `data/uploads`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin account, used only by `npm run db:seed`. |
| `CONTACT_WEBHOOK_URL` | Optional. Every lead is saved to the admin inbox; when this is set it is *also* POSTed here as JSON with its `kind` and language (CRM, Zapier, Make, Slack…). |
| `SITE_URL` | Absolute site URL, used for Open Graph and `hreflang` links (defaults to `http://localhost:3000`). |
| `SIMULATE_LISTINGS_ERROR` | Set to `1` in development to make the data layer throw, which lets you preview the error UI. Ignored in production. |

---

## Project structure

```
src/
  proxy.ts                      Redirects URLs without a language prefix (cookie → Accept-Language → English); gates /admin
  db/                           Drizzle schema, libSQL connection, seed (migrations live in drizzle/)
  app/admin/                    Staff admin: (auth)/login and (panel)/ dashboard, listings, leads, team, account
  app/media/[...key]/route.ts   Serves uploaded photos from storage
  lib/admin/                    Admin form parsing, permissions, queries, activity log
  lib/auth/                     Password hashing (scrypt) and cookie sessions
  lib/storage/                  PhotoStorage interface + local-disk implementation (sharp processing)
  i18n/
    config.ts                   Locales, direction, path helpers, Accept-Language negotiation
    dictionaries/en.ts, ar.ts   All UI strings (Arabic is type-checked against English)
    plural.ts                   CLDR plural rules (Arabic has six forms) + number formatting
    I18nProvider.tsx            Gives client components the locale and strings
  app/
    globals.css                 Design tokens (light, dark, contrast, text size, motion, Arabic) + base styles
    global-error.tsx            Last-resort error page (bilingual)
    fonts.ts                    Cairo + Montserrat via next/font (self-hosted)
    icon.svg / apple-icon.png   Favicon and touch icon (generated by `npm run brand`)
    [locale]/                   Every route lives under the language segment
      layout.tsx                Root layout: <html lang dir>, pre-paint appearance script, header, footer, hreflang
      page.tsx                  Home
      error.tsx / not-found.tsx
      listings/
        page.tsx                Properties (reads ?deal & ?type and server-renders the filtered view)
        loading.tsx / error.tsx Skeleton + failed-fetch state with "Try again"
        [id]/
          page.tsx              Property detail (generateStaticParams for every locale × listing)
          not-found.tsx         Unknown/withdrawn property → real 404
          loading.tsx
      saved/
        page.tsx                Saved properties (server-renders summaries; the client island picks the saved ones)
      about/
        page.tsx                About & Contact
        actions.ts              Server Action: validate → sanitise → deliver enquiry (replies in the form's language)
  components/
    ListingsExplorer.tsx        Client island: filter state, URL sync, live results announcement
    BrandMark.tsx / Wordmark.tsx  The "lk" logo mark (SVG) and the AL KHOURY lock-up
    ChoiceGroup.tsx             Native radio group styled as pills (filters and settings)
    AppearanceSettings.tsx      Header button + <dialog> for language, theme, text size, contrast, motion
    ListingCard.tsx / ListingGrid.tsx
    PropertyGallery.tsx         CSS scroll-snap gallery (no JS)
    ContactForm.tsx             Client island: useActionState, inline errors, focus management
    FavouriteButton.tsx         Client island: the save heart (aria-pressed) on cards and the property page
    SavedLink.tsx / SavedListings.tsx  Header link with count badge; the saved-properties list
    ShareButton.tsx             Client island: system share sheet, or copy the link with a status message
    SiteHeader.tsx / NavLink.tsx (+ LanguageLink) / SiteFooter.tsx
    ErrorState.tsx / NotFoundState.tsx / LoadingStatus.tsx
  lib/
    types.ts                    Listing model (single source of truth for the shape of data)
    data/listings.ts            ⟵ THE data-access module (the only place pages get listings from)
    data/placeholder-listings.ts  Placeholder data, with English and Arabic text
    filters.ts                  Pure filtering/URL/counting logic (fully unit-tested)
    contact.ts                  Pure validation + sanitisation (fully unit-tested)
    contact-delivery.ts         Server-only webhook delivery
    appearance.ts               Appearance settings: parse, persist, apply, and the pre-paint script
    favourites.ts               Saved properties: localStorage-backed store + useFavourites() hook
    format.ts / facts.ts / company.ts / seo.ts
tests/                          Vitest + Testing Library
scripts/fetch-photos.mjs, generate-brand.mjs
public/images/photos/           Optimised stock photography + CREDITS.md
```

### What runs on the client

Pages are React Server Components. Only small client islands ship JavaScript:

1. `ListingsExplorer` (with `ChoiceGroup` and the cards it renders) filters in memory, so a tap gives instant feedback without a network round trip.
2. `ContactForm` handles pending state, inline errors and focus. The form still works without JS because it posts straight to the Server Action.
3. `AppearanceSettings` runs the settings dialog.
4. `NavLink` / `LanguageLink` set `aria-current` and build language-switch links.
5. `FavouriteButton`, `SavedLink` and `SavedListings` read and update the saved-properties store.
6. `ShareButton` opens the share sheet or copies the link.

The current language's dictionary (a few KB) is passed to the client once through `I18nProvider`. The gallery,
sticky contact bar, cards on the home and detail pages, and every animation are pure HTML/CSS.

---

## Design system

The interface follows the style reference in `airbnb.md`: a quiet, photograph-first white canvas, with
Al Khoury gold as the one accent.

- **Canvas and colour.** White pages, with `#f7f7f7` for the footer and muted panels. Text is near-black `#222` and
  secondary text `#6a6a6a` (5.4:1). Rows and sections are separated by hairlines (`#ebebeb`), not boxes.
  Gold appears only on the logo, the search button and the single primary action on a page. Other actions use
  a near-black inverse button or a ghost outline.
- **Type.** DM Sans (the reference's recommended open substitute for its custom geometric sans), on a compact
  scale: 14px card text and metadata, 16px UI, 22px section titles with −0.02em tracking, 28px page titles.
- **Shape.** Flat, borderless cards with 12px photo corners; pill and circular controls; 8px inputs and
  ghost buttons. Shadows only on floating elements (search capsule, enquiry card, dialogs, carousel arrows).
- **Home.** A photographic hero (inset, rounded, dark gradient for legible white type) with the search capsule floating over its lower edge, then a spotlight listing, photo rows, the firm in numbers and a black-and-gold brand band. The capsule is a plain GET form (works without JavaScript)
  submitting `?deal` and `?type` to the listings page. Below it are horizontal photo rows (featured, then
  one per property type), each with a "title →" link to the filtered list and circular previous/next
  buttons on desktop.
- **Header.** Logo, centred navigation (Properties, Buy, Rent, About & Contact), then the phone number, a black Enquire button and the language/appearance button. Lower-priority items drop away as the screen narrows.
- **Search.** A one-tap Buy / Rent toggle above a capsule with **Where** (region) and **Property type** fields and a gold search button. Region is a first-class filter (`?region=`), also available as a dropdown on the listings page.
- **Listings.** A sticky category bar (outline icon + label, 2px underline on the active tab) for property
  type, and outlined pills for Buy / Rent. Options with no results are dimmed, not hidden.
- **Property page.** Title and location, a one-large-plus-two photo grid with outer corners rounded,
  hairline-separated sections, and a floating enquiry card with the price.
- **Icons** are drawn for this site (`src/components/icons.tsx`): 24px, 1.6px outline, `currentColor`.
  Directional icons mirror in Arabic.

## Brand

The site follows the Al Khoury Real Estate identity: black and gold, the "lk" building mark, and the
"AL KHOURY / REAL ESTATE" lock-up.

- **Mark.** `src/components/BrandMark.tsx` is a vector redraw of the logo (Option 1, "clean & modern") with
  the brand's gold gradient. It sits on a black tile in the header and footer (`Wordmark.tsx`) and in the
  favicon/Apple touch icon (`npm run brand`). A test fails if the icons drift from the component.
- **Colours.** Brand black `#0b0b0c` and gold `#c9a45c` (light `#f3dc9e`, deep `#9c7130`).
  - Light theme: black for selected states, gold buttons with black text (8.4:1), bronze-gold `#8a6420` for links and eyebrows (5.4:1).
  - Dark theme: the brand black as the background, with gold `#d9b56a` for links, buttons and selected filters (10.4:1).
  - Gold is never used for body text on white, because it fails contrast there.
- **Type.**
  - **Arabic: Cairo.** A contemporary Kufi-based Arabic sans with a variable weight axis, widely used on Arabic-language sites and well matched to the geometric Latin type.
  - **Wordmark: Montserrat**, wide-tracked capitals as in the logo.
  - English text: DM Sans (see [Design system](#design-system)).
  - Both web fonts are self-hosted by `next/font` (`src/app/fonts.ts`): downloaded at build time, with no request to Google at runtime and size-adjusted fallbacks to avoid layout shift. The Arabic font isn't preloaded, so English visitors never download it.
- **Imagery.** The brand roundel (`public/images/brand/al-khoury-brand.webp`) appears in the home brand band and on the About page. The footer is brand black with gold headings in every theme.

## Languages (English / Arabic)

- **Routing.** Every page lives under `src/app/[locale]/`. `src/proxy.ts` redirects any URL without a prefix,
  keeping the query string. It picks the language from the `NEXT_LOCALE` cookie (set when someone switches
  language), then the browser's `Accept-Language`, then English. Each page declares `hreflang` alternates and a
  canonical URL.
- **Direction.** `<html lang dir>` is set per locale. Layout CSS uses logical properties (`inset-inline-start`,
  `margin-inline`, …), so the same styles mirror for Arabic. Chevrons flip via a `--chevron-end` token. Phone
  numbers, emails, prices and the email/phone inputs are kept left-to-right with `dir="ltr"` or Unicode bidi isolates.
- **Typography.** Arabic uses Cairo (see [Brand](#brand)), with no negative letter-spacing (it breaks
  cursive joining), taller line heights and slightly heavier headings.
- **Strings.** `src/i18n/dictionaries/en.ts` defines the shape. `ar.ts` is typed as `Dictionary`, so a missing key
  fails the build, and a test also checks that every Arabic plural has the one/two/few/many/other forms.
- **Plurals and numbers.** `plural()` uses `Intl.PluralRules`, so counts read naturally ("عقار واحد", "عقاران",
  "3 عقارات", "11 عقارًا"). Arabic uses Latin digits and prices show as `$1,250,000`, the common convention in
  Lebanese listings.
- **Listing content** comes from the data layer per locale: `ListingsSource.list(locale)` and `getById(id, locale)`.
- **Adding a language**: add it to `LOCALES` / `LOCALE_META` in `src/i18n/config.ts`, add a dictionary typed as
  `Dictionary`, and provide listing text for it in the data source.

## Appearance settings

The header's half-circle button opens a native `<dialog>`. Focus stays inside it, Esc closes it, and focus returns
to the button. On phones it opens as a bottom sheet. It holds:

| Setting | Options | How it works |
| --- | --- | --- |
| Language | English / العربية | Same page in the other language; remembered in a cookie |
| Theme | System / Light / Dark | `data-theme` on `<html>`. "System" follows `prefers-color-scheme` |
| Text size | Default / Large / Larger | `data-text` scales the root font size (100 / 112.5 / 125%). Every size is in rem |
| Contrast | System / Increased | `data-contrast="more"` darkens secondary text and borders, thickens focus rings and underlines links. "System" honours `prefers-contrast: more` |
| Motion | System / Reduced | `data-motion="reduce"` stops all animation and smooth scrolling. "System" honours `prefers-reduced-motion` |

Choices are saved in `localStorage` (`ak-appearance`). A tiny inline script in `<head>` applies them **before first
paint**, so a saved dark theme never flashes light, and pages stay statically generated. That script is covered by
a test that checks it matches `applyAppearance()`. All colours are tokens in `globals.css`, with light and dark
values and WCAG AA ratios noted.

---

## Admin

A staff back office at `/admin` (English UI; listing text is edited in English and Arabic side by side).
It is part of the same Next.js app and shares the site's tokens, so light/dark, text size and contrast settings
carry over. It works on a phone (the sidebar becomes a top bar).

| Section | Admin | Advisor |
| --- | --- | --- |
| **Dashboard** | New and unassigned leads, leads this week, listings by status, latest leads, recent activity | Same, scoped to their own listings and leads |
| **Listings** | Create, edit, publish/unpublish/archive, delete; assign an advisor; feature on the home page | Create and edit their own listings (a new listing is theirs) |
| **Photos** | Upload (drag and drop, 8 at a time), reorder, choose the cover, edit EN/AR descriptions, delete | Same, on their own listings |
| **Leads** | Every enquiry, viewing and valuation request; filter by status, type and assignee; assign; notes | Leads routed to them |
| **Website** | Contact details, office map, social links, the home page photo, which page sections show, the numbers, and **every text on the site** in English and Arabic (see below) | — |
| **Team** | Add staff (a temporary password is generated and shown once), change role, deactivate, reset passwords, edit public advisor profiles (Arabic name, title, languages, phone/WhatsApp, regions, order, visibility) | — |
| **My account** | Change password; edit own public profile | Same (regions and visibility stay as an admin set them) |

**Website editor (Admin → Website, admins only)**

- **Contact & map**: office phone, WhatsApp number, email and founding year (used in the header, footer, About page, property pages and error pages); show/hide the header phone and the floating WhatsApp button; the **office map pin** (click the map, paste a Google Maps / OpenStreetMap link, or type coordinates); address and opening hours in both languages; company name and tagline; social links (shown in the footer under “Follow us” when filled in); the WhatsApp greeting messages.
- **Home page**: replace or restore the hero photo (processed like listing photos), show/hide the search bar, spotlight, featured row, rows by type, the numbers and the brand band; edit the headline, numbers and every heading.
- **About page**: show/hide the numbers, “How we work” and opening hours; edit every text.
- **All texts**: every string on the public site, grouped by section, searchable in either language, with an *Edited only* filter. Each text shows *Edited* when changed and has *Reset to default*. Placeholders such as `{year}` or `{count}` are filled in by the site, so a text that drops one is refused.

How it works: settings are one JSON document (`site_settings`, merged over the defaults in `src/lib/site.ts`), and edited texts are stored per language and path (`content_overrides`, e.g. `ar` / `home.heroTitle`) and applied over the bundled dictionaries by `getSiteDictionary()`. An untouched text keeps following the code. If the database can't be read, the site renders with the defaults instead of failing.

**What each listing shows (Admin → listing → “What the website shows”)**

Each listing can hide: the price (“Price on request”, also left out of budget filters and sorted last), the neighbourhood (city only), bedrooms, bathrooms, size, plot, year built, the “Listed on” date, the features list, the payment calculator, the viewing form (its buttons then lead to the enquiry form), the advisor card and similar properties. Hidden values are removed on the server, so they are not in the page or its data. Advisors can set these on their own listings.

**Maps.** A listing can show no map, an **approximate area** (rounded to about 1 km on the server, no pin, with a note that the address is shared at the viewing) or the **exact location** with a pin. Maps are OpenStreetMap embeds with a “Open in Maps” / “Get directions” link: no API key, no tracking script. The admin picker uses Leaflet with OpenStreetMap tiles.

**How it connects to the site**

- The public site reads **published** listings with at least one photo from the database (`src/lib/data/db-source.ts`). Drafts and archived listings are invisible; publishing needs both languages filled in and a photo.
- Every change in the admin rebuilds the affected public pages in both languages (`revalidatePath`), so edits are live immediately while pages stay statically served.
- The advisor card on a property page shows the listing's advisor, or whoever covers its region if that person has no visible profile.
- Website forms (enquiry, viewing, valuation) are saved as **leads**. A property lead is routed to that listing's advisor and a valuation to the advisor covering its region; anything else waits for an admin. The visitor only sees an error if the lead reached neither the inbox nor the webhook.
- Every significant action is written to an activity log, shown on the dashboard and in each lead's history.

**Database.** SQLite through [Drizzle ORM](https://orm.drizzle.team) and libSQL (`src/db/schema.ts`; migrations in
`drizzle/`). Tables: `users`, `advisor_profiles`, `sessions`, `listings`, `listing_photos`, `leads`, `lead_notes`, `site_settings`, `content_overrides`,
`activity`, `login_attempts`. To move to Turso, set `DATABASE_URL`/`DATABASE_AUTH_TOKEN`; nothing else changes.
For Postgres, switch the dialect imports in `schema.ts` and `src/db/index.ts` and regenerate migrations.

**Photos.** Uploads are decoded with sharp (so only real JPEG/PNG/WebP/AVIF/HEIC files pass), rotated per EXIF,
**stripped of all metadata including GPS**, capped at 2400 px and re-encoded to WebP. They are stored behind the
`PhotoStorage` interface (`src/lib/storage/index.ts`): local disk today (`UPLOAD_DIR`, served by `/media/…` with
immutable caching). For Cloudinary or S3, implement `put`/`get`/`delete`/`url` and return it from `getPhotoStorage()`.

**Deploying.** The local-disk database and uploads need a host with a **persistent disk** (a VPS, Railway/Render
with a volume, Fly.io volume). On serverless hosts (Vercel), use Turso for the database and an object store for
photos. Back up `data/` (or the Turso database) regularly.

**Security**

- Passwords are hashed with scrypt (Node's built-in, per-user salt, cost parameters stored with the hash) and must be at least 12 characters.
- Sessions are random 256-bit tokens in an `HttpOnly`, `SameSite=Lax` cookie scoped to `/admin` (`Secure` in production). Only a SHA-256 of the token is stored, so a leaked database can't be replayed. Sessions last 7 days and are revoked on password change, reset or deactivation.
- Sign-in is throttled per email (5 failures per 15 minutes) and per IP (20), with a constant-time comparison and the same message for unknown emails and wrong passwords.
- Every Server Action re-checks the session and the role (`src/lib/admin/permissions.ts`); hidden buttons are never the only guard. Other people's leads and listings return 404 to advisors. Next.js's Origin check on Server Actions protects against CSRF.
- The proxy sends visitors without a session cookie straight to the login page, and marks every `/admin` response `noindex` and `no-store`.
- The post-login redirect only accepts same-site `/admin` paths, so there is no open redirect.
- There must always be one active admin: an admin can't demote or deactivate themself, or the last admin.
- Behind a reverse proxy, make sure it sets `X-Forwarded-For`, which the per-IP limit relies on.

---

## Swapping in a real data source

The live source is the database (managed in the admin); `placeholderListingsSource` serves the bundled seed data
and is what the unit tests use. All listing reads go through `src/lib/data/listings.ts`. UI components only depend on the types in
`src/lib/types.ts` and the functions exported from that module (`getListings(locale)`,
`getListingSummaries(locale)`, `getFeaturedListings(locale)`, `getListingById(id, locale)`, `getListingIds()`).

To use an API or headless CMS:

1. **Implement `ListingsSource`** and map the remote payload to the `Listing` type, with text in the requested language:

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
     async list(locale) {                                // most CMSs take a locale parameter
       const res = await fetch(`${BASE}/listings?locale=${locale}`, { headers, next: { revalidate: 300, tags: ['listings'] } });
       if (!res.ok) throw new Error(`Listings API ${res.status}`);
       return (await res.json()).items.map(toListing);
     },
     async getById(id, locale) {
       const res = await fetch(`${BASE}/listings/${encodeURIComponent(id)}?locale=${locale}`, { headers, next: { revalidate: 300, tags: ['listings'] } });
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

**At scale.** Filtering runs in memory, which suits a portfolio of up to a few hundred listings. For thousands,
move filtering to the server. Add `getListings(locale, filters)` that passes `deal`/`type` to the API, then have
the explorer navigate with `router.replace()` instead of filtering locally. `filters.ts` already parses and
serialises the URL contract.

---

## Property-page and growth features

| Feature | Where | Notes |
| --- | --- | --- |
| Full-screen photo viewer | `PropertyGallery.tsx` | Native `<dialog>`; previous/next, live "2 / 5" counter, thumbnails, arrow keys, Home/End, swipe; mirrored in Arabic. Every gallery photo and *Show all photos* open it. |
| Verified + listed badges | property page | `verified` on a listing shows *Title deed verified*; `listedAt` is shown as a localised date. |
| Advisor card | `AdvisorCard.tsx`, `lib/data/advisors.ts` | Chosen by region. **Placeholder people**: replace names, numbers and regions with the real team. Initials instead of stock photos of people. |
| Payment calculator | `PaymentCalculator.tsx`, `lib/mortgage.ts` | Sale listings only. Down payment slider, term, rate → monthly payment, loan and total interest. Marked as an estimate, not an offer. |
| Book a viewing | `ViewingForm.tsx`, `lib/viewing.ts`, `listings/[id]/actions.ts` | Date (tomorrow → 60 days), time of day, name, phone, notes. Server-validated; delivered as a `viewing` lead. |
| Similar properties | `getSimilarListings()` in `lib/data/listings.ts` | Same type and deal first, then type, then region. |
| Filters panel + sort | `FiltersDialog.tsx`, `lib/filters.ts` | Budget (presets per Buy/Rent, only once one is chosen), bedrooms (n+), size (m²+). Changes are drafted and previewed ("Show 4 properties") before applying. |
| List your property | `/[locale]/sell`, `ValuationForm.tsx`, `lib/valuation.ts` | Owner lead form, delivered as a `valuation` lead. Linked from the footer and the home brand band. |
| Floating WhatsApp | `WhatsAppFab.tsx` | On every page except property pages (which pre-fill the property instead). WhatsApp's darker teal keeps the icon at 4.3:1. |
| Installable app | `app/manifest.ts`, `public/brand/icon-*.png` | Add to Home Screen on iOS/Android, opens full-screen. Offline support would additionally need a service worker. |

All leads (enquiries, viewings, valuations) go through `deliverLead()` in `lib/contact-delivery.ts` to
`CONTACT_WEBHOOK_URL` as JSON with a `kind` field (`enquiry` | `viewing` | `valuation`), so a CRM or automation can route them.

### Not built yet (need decisions or real content)

- **Map view and listing maps:** choose a provider (e.g. Mapbox, Google Maps or OpenStreetMap tiles) and add coordinates to each listing.
- **Saved-search alerts and a newsletter:** need an email service (e.g. Resend, Mailchimp) and consent wording.
- **Video tours, floor plans, price history:** need real assets and data per listing; the `Listing` type can be extended.
- **Client reviews and area guides:** need genuine reviews and written guides. Reviews must never be invented.

## Saved properties, sharing and WhatsApp

**Saved properties.** A heart sits in the top inline-end corner of every card's photo (top right in English,
top left in Arabic) and beside *Share* on the property page. It is a real `<button>` with a fixed name
("Save {title}") and `aria-pressed`, so screen readers announce "toggle button, pressed". Saved hearts fill gold.
Saved ids are stored per device in `localStorage` (`ak-saved`, newest first, capped at 200). Every read and write
is wrapped in `try/catch`, so saving still works for the page view when storage is blocked. All hearts and the
header count share one store (`src/lib/favourites.ts`, read through `useSyncExternalStore`) and stay in sync,
including across tabs via the `storage` event. The server render always shows "not saved", and the stored state
appears right after hydration, so markup never mismatches.

`/[locale]/saved` server-renders every listing summary and picks out the saved ones on the client. A property you
unsave on that page stays on screen with an empty heart until you leave, so a mis-tap can be undone and keyboard
focus is never lost. Ids for listings that no longer exist are dropped. The page is `noindex` because its
content is personal.

**Share.** On the property page, *Share* opens the system share sheet where the browser has one (`navigator.share`,
mostly phones). Otherwise it copies the page URL and says "Link copied" in a polite live region. If copying is
not allowed, it asks the visitor to copy the address bar instead. Dismissing the share sheet shows nothing.

**WhatsApp.** The contact card and the phone sticky bar link to `https://wa.me/<number>?text=…`, with the message
pre-filled in the page's language: the property title and its absolute URL (built from `SITE_URL`, so set it
in production). The number is `COMPANY.whatsapp` in `src/lib/company.ts`. It is a **placeholder**: use digits
only, country code first. The link opens in a new tab with `rel="noopener noreferrer"`. On phones, Call and
WhatsApp are icon buttons with accessible names, so the price keeps its room on a 375 px screen.

---

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`, `search`), a skip link, a logical heading order, and breadcrumbs on the detail page.
- Filters are **native radio groups** inside `fieldset`/`legend`. Arrow keys and screen-reader announcements ("radio button, 2 of 5, checked") come for free. Each option's result count is read out ("Apartments, 4 listings").
- The results summary (for example "3 apartments for rent" / "3 شقق للإيجار") sits in a `role="status"` live region, so screen readers announce each filter change.
- Form fields have visible labels, `autocomplete`/`inputmode` hints, and `aria-invalid` + `aria-describedby` error text. After a failed submit, focus moves to the first invalid field; after success, to the confirmation.
- One consistent, high-contrast focus ring (`:focus-visible`). Tap targets are at least 44 × 44 px. Body text is 17 px.
- Colour contrast meets WCAG AA in both themes. Ratios are documented beside each token in `globals.css`.
- User-adjustable text size, contrast, theme and motion (see [Appearance settings](#appearance-settings)). `prefers-reduced-motion`, `prefers-contrast` and `prefers-color-scheme` are honoured by default. `forced-colors` keeps the selected filter visible.
- `lang`/`dir` are correct per page, and labels in the other language (e.g. "العربية" on an English page) carry their own `lang`, so screen readers switch voice.
- Error boundaries move focus to their heading and use `role="alert"`.

## Performance

- Server Components by default. Home and property pages are statically generated for both languages.
- `next/image` everywhere, with responsive `sizes`, AVIF/WebP, and `priority` only for above-the-fold images.
- Web fonts are self-hosted woff2 files: DM Sans (Latin, preloaded), Montserrat (wordmark only) and Cairo (Arabic pages only, not preloaded).
- Appearance settings are applied by a ~400-byte inline script, so pages stay static (no cookies read at render time).
- Cards pass a trimmed `ListingSummary` to the client instead of full listings.

## Security

- **Contact form**: every field is validated and sanitised **on the server** (`src/lib/contact.ts`). That covers Unicode normalisation, removal of control and bidi-override characters and of HTML tags and angle brackets, whitespace collapsing, length limits, an email/phone format check, and an allow-list pattern for the property reference. The locale field is checked against the supported locales. React escapes output too. The sanitising also protects downstream systems such as CRMs and email bodies.
- A honeypot field silently drops most bot submissions.
- Secrets live only in server-only env vars. `server-only` imports make the build fail if a server module is ever imported into client code.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`, and `X-Powered-By` is disabled.
- Route params and query strings are validated against allow-lists before use.
- **Before launch** (infrastructure-dependent, so deliberately not stubbed here): add rate limiting to the contact action (at the edge/WAF or with a KV-backed limiter). If you add a CSP, allow the inline appearance script with a nonce or hash.

## Testing

```bash
npm test
```

177 tests across 18 files. Tests that need a database get their own migrated SQLite file in a temp folder
(`tests/db.ts`); every other test points at an empty in-memory database, so the suite never touches `data/`.

| File | Covers |
| --- | --- |
| `filters.test.ts` | URL parsing (including malicious input), serialisation round-trip, type/deal filtering, option counts, result sentences in English and every Arabic plural form |
| `ListingsExplorer.test.tsx` | Tapping filters updates results, the live-region text and the URL; keyboard arrow-key use; empty state and recovery; Clear filters; localised card links; the Arabic UI |
| `ListingCard.test.tsx` | Card content and accessible price in both languages; price/area/place/fact formatting, including RTL isolation |
| `data-listings.test.ts` | Placeholder data integrity and translation completeness; sorting; summaries; by-id lookup per locale (unknown and malformed ids); failure wrapping; the locale reaching a custom source |
| `contact.test.ts` | Sanitisation, validation, the Server Action (no webhook, webhook failure, honeypot, no PII in logs, Arabic replies, unknown locale) |
| `ContactForm.test.tsx` | Labels, pre-fill, inline server errors with focus, success state; the Arabic form (LTR email/phone, locale sent) |
| `ErrorState.test.tsx` | Failed-fetch boundary (focus, retry) and property not-found page, in both languages |
| `i18n.test.ts` | Arabic/English dictionary parity and plural completeness, placeholder consistency, path helpers, Accept-Language negotiation |
| `proxy.test.ts` | Language redirects: prefixed URLs pass through; cookie beats Accept-Language; query strings kept; English fallback |
| `browse-ui.test.tsx` | Search capsule (GET form, field values match the URL contract, "any" = no filter, Arabic); category tabs (radio semantics, icons, dimmed empty options); row scroller labels and disabled arrows |
| `features.test.tsx` | Mortgage maths; budget/bedroom/size filters and sorting (URL contract included); viewing and valuation validation (date window, tampered ids); advisors; photo viewer (buttons, keys, close); calculator; filters panel (draft, preview count, disabled budget); floating WhatsApp |
| `brand.test.tsx` | Generated icons match the `BrandMark` paths; unique gradient ids per instance; the lock-up in both languages |
| `favourites.test.tsx` | Store parsing (corrupt/malicious data, de-duplication, cap), toggling, persistence, blocked storage, cross-tab sync, pruning; the heart toggle (aria-pressed, keyboard, kept in sync, Arabic, outside the card link); header count; the saved page (order, unsave-keeps-card, empty state, Arabic plurals) |
| `share.test.tsx` | Share sheet when available, silent on dismiss, clipboard fallback with status message, fallback after a share error, no-clipboard message in Arabic; the encoded `wa.me` link |
| `appearance.test.tsx` | Settings parsing and attributes; the pre-paint script matching `applyAppearance`; the dialog applying, persisting, restoring and resetting choices; Arabic labels |
| `admin.test.ts` | Listing form (slug generation, numbers, enums, dates, publish-needs-both-languages, land drops rooms, markup stripped); account and profile forms; post-login redirect allow-list; role permissions; scrypt hashing and the password policy; phone normalisation; relative times |
| `website.test.ts` | Text flattening, overrides and placeholder protection; settings merge and validation (unticked switches, bad phone/email/year/URL/zoom); tel/WhatsApp/map links; pasted Google/OSM link parsing; hidden listing details stripped on the server (price, area, rooms, size, features) and the approximate pin rounded; price-on-request in budget filters and sorting; listing-form display switches and map pin |
| `database.test.ts` | Against a real SQLite file: migrations and an idempotent seed; website settings and edited texts saved, applied to the dictionary and reset; the DB source returns exactly the placeholder catalogue in both languages; drafts and photo-less listings hidden; advisor fallback; website leads saved and routed (listing advisor, region, unknown property id); photo uploads re-encoded to WebP without EXIF and resized; non-images and path-traversal keys rejected |

Manual checks done in a browser against the production build at 375 px (mobile), 768 px (tablet) and
1280 px (desktop): no horizontal overflow, filtering and URL sync, the property gallery and sticky contact bar,
the full contact-form round trip (server-side error and success), a real 404 status for unknown properties,
and keyboard focus order. Also checked: Arabic RTL pages on a phone in dark mode, the language redirect and
switcher (page and filters kept, choice remembered), settings persisting across navigation, increased contrast
and reduced motion, and an Arabic enquiry end to end.
For saved properties, sharing and WhatsApp: saving by mouse and keyboard, the header badge, the saved page in both
languages, the share fallback message, the pre-filled WhatsApp links, and the phone sticky bar in Arabic RTL in
light and dark mode.
For the admin, against the production build: the login redirect (with `next`), a wrong password rejected, a
viewing request sent from a property page arriving on the dashboard and in the inbox (routed to the right advisor),
adding a note (moves the lead to *Contacted*), creating a draft with server-side validation keeping what was
typed, uploading photos (resized WebP served from `/media`), changing the cover, publishing and seeing the
listing live in Arabic, editing the price, deleting the listing (files removed, public page 404), generating an
advisor password and signing in as that advisor (Team hidden, other people's leads and listings 404, no feature
or assign controls), the phone layout at 375 px (light theme) and the desktop layout in dark mode.

---

## Assumptions

- **Market and currency**: listings are in Lebanon and priced in **USD** (`$1,250,000` in both languages), with rentals shown per month.
- **Arabic** is Modern Standard Arabic with Latin digits. The translations should be reviewed by a native-speaking copywriter before launch, especially the listing descriptions.
- **Language in the URL** (`/en`, `/ar`) rather than a cookie only. That keeps pages static, shareable and indexable per language.
- **Appearance settings are per device** (localStorage), since there are no user accounts.
- **Filtering** is single-choice per group (one deal type, one property type). That gives the simplest phone UI and keeps URLs readable. Price, bedroom filters and sorting were left out to stay within scope.
- **Contact** is through a form that posts to a webhook, plus phone (`tel:`) and email links. No email provider or CRM is assumed.
- **Company details** (phone, WhatsApp, email, address, founding year, the numbers) are **placeholders** until changed in **Admin → Website**; the defaults live in `src/lib/site.ts` and the dictionaries, and the email uses the reserved `.example` domain.
- **Photos** are free-licence stock images from Unsplash (Unsplash License), self-hosted and credited in `public/images/photos/CREDITS.md`, with descriptive English and Arabic alt text. They illustrate the kind of property only; replace them with real listing photos before launch (edit `photos.json` or point the data source at CMS images).
- **Saved properties are per device** (localStorage) for the same reason: they don't follow a visitor to another browser.
- There are no visitor accounts, payments or saved searches. Maps were added on request (OpenStreetMap, no key). Accounts exist only for staff, in the admin.
- **Advisors** (Nadine Azar, Karim Haddad, Maya Saad) are fictional placeholders, seeded without passwords so they cannot sign in. Replace them with the real team in **Admin → Team**.
