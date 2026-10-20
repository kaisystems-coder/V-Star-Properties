# V-Star Properties — website preview

The site for V-Star Properties Company Limited (San Fernando, Trinidad), built
on the Real Estate Demo framework. A preview for the client before go-live:
the front end is complete, the backend (Supabase) slots in behind one file.

```bash
npm install
node node_modules/next/dist/bin/next dev -p 5650   # http://localhost:5650
```

(The OneDrive path has spaces, so run Next directly rather than `npm run dev`.)

## What is in it

- **138 real listings** (66 for sale, 72 to rent), now in Supabase, imported from her current
  site, v-starproperties.lovable.app, which mirrors her My Bunch of Keys
  listings. Titles, prices, beds/baths, descriptions and photos are hers;
  property type, region, amenity tags and map positions are derived.
- **One agent.** `/our-agents` is a single profile card; her profile at
  `/our-agents/v-star-properties` shows every listing right on the page, with
  All / Homes for sale / For rent / Land / Commercial tabs, a sort, and
  12-at-a-time paging.
- **Socials** (Facebook, Instagram, My Bunch of Keys, WhatsApp) in
  `BRAND.socials` in `components/Logo.tsx`, shown in the footer, on her
  profile and on /contact.
- **Brand** from `V-Star_Properties_Brand_Guidelines.pdf`: tokens in
  `tailwind.config.ts` (ink = Charcoal, brand = Property/Trust Blue, accent =
  Fresh Green on dark and Trust Blue on light), Lato + Tinos (Liberation Serif).

## SEO and AI search (AEO)

- **16 neighbourhood pages** at `/areas/<name>` (La Romaine, Palmiste, Gulf View…)
  for any area with 3+ listings, plus 5 region pages at `/trinidad/<region>`.
  Every figure on them is computed from her listings (`lib/aeo.ts`).
- **Quick answers + FAQPage schema** on area and region pages, `/faq` (stamp
  duty, areas covered, viewings) and the homepage.
- Structured data: RealEstateAgent (geo, contact point, socials), WebSite with
  a search box, RealEstateListing per listing, BreadcrumbList, ItemList,
  ProfilePage.
- `sitemap.xml` (170 URLs, with listing photos), `robots.txt` that explicitly
  allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…),
  `llms.txt` (her details plus every listing with its price), web manifest,
  geo meta tags, branded 1200x630 share image (`public/brand/og.jpg`).
- Search Console / Bing verification: set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
  and `NEXT_PUBLIC_BING_SITE_VERIFICATION` and the meta tags appear.

At launch: set `NEXT_PUBLIC_SITE_URL`, submit `/sitemap.xml` in Google Search
Console and Bing Webmaster Tools, and link the site from her Google Business
Profile, Facebook page and Instagram bio.

## Open items for the client

- Her name and a headshot: `lib/agents.ts` (`name`, `image`, drop `imageIsLogo`).
- Her commission rates: `app/sell/page.tsx` (currently marked indicative).
- Location of "Brentwood Townhouse for rent" (no area on her listing; filed
  under San Fernando with no map pin).
- Hero video is stock footage of other homes; swap for her own footage or a
  bright exterior when she has one.

## Listings backend (Supabase)

Her listings and photos live in Supabase, and she manages them herself at `/admin`
(email + password). Every save shows on the site right away. Details, migrations
and tests are in `supabase/README.md`.

Environment (copy `.env.example` to `.env.local`, and set the same three in Vercel):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `TENANT_ID`.
The build reads the listings, so it fails loudly if these are missing.
