import type { Listing } from '@/types/listing';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase/config';
import { fromRow, type ListingRow } from './supabase/rows';
import { TENANT_ID } from './supabase/tenant';

/**
 * The public site's read path: her published listings, from Supabase.
 *
 * Plain fetch against PostgREST (not supabase-js) so Next's data cache holds
 * the result: every page is static, and one `revalidateTag('listings')` from
 * /api/revalidate — called by the admin after each save — refreshes them all.
 * The hourly revalidate is only a safety net for edits made outside the admin.
 *
 * Runs as `anon`, so RLS returns published rows only. The tenant filter is
 * defence in depth and keeps the query on the tenant index.
 */
export const LISTINGS_TAG = 'listings';

export async function getListings(): Promise<Listing[]> {
  const res = await fetch(
    SUPABASE_URL +
      '/rest/v1/listings?select=*&is_published=eq.true&tenant_id=eq.' +
      TENANT_ID +
      '&order=date_listed.desc,created_at.desc',
    {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      cache: 'force-cache',
      next: { tags: [LISTINGS_TAG], revalidate: 3600 },
    },
  );
  // Throw rather than render an empty catalogue: at build that fails the
  // deploy, and at runtime Next keeps serving the last good page.
  if (!res.ok) throw new Error('Listings fetch failed: ' + res.status + ' ' + (await res.text()));
  return ((await res.json()) as ListingRow[]).map(fromRow);
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  // Same cached request as getListings, so this costs nothing extra.
  return (await getListings()).find((l) => l.slug === slug);
}

/**
 * Related listings for a detail page: same region first, then same property
 * type, so a Tobago villa suggests other Tobago property before a Chaguanas
 * estate. Falls back to filling with anything recent if the match is thin.
 */
export function getRelatedListings(
  listing: Listing,
  pool: Listing[],
  limit = 3,
): Listing[] {
  const others = pool.filter((l) => l.id !== listing.id);
  const score = (l: Listing) =>
    (l.region === listing.region ? 2 : 0) +
    (l.propertyType === listing.propertyType ? 1 : 0) +
    (l.listingType === listing.listingType ? 1 : 0);
  return [...others].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
