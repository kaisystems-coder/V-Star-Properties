import type { MetadataRoute } from 'next';
import { getListings } from '@/lib/listings';
import { getAgents } from '@/lib/agents';
import { REGIONS } from '@/lib/filters';
import { regionSlug } from '@/lib/regions';
import { areaSlug, areasWithPages } from '@/lib/aeo';
import { abs, SITE_URL } from '@/lib/seo';

/**
 * The sitemap, generated from the same data the pages render from.
 *
 * Built from her published listings in Supabase, the same cached read the
 * pages render from. Listing entries carry their photos, so they can surface in
 * Google Images as well as web results.
 *
 * Excluded: /saved and /admin (also disallowed in robots.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getListings();
  const now = new Date();
  const newest = listings.reduce(
    (d, l) => (l.dateListed > d ? l.dateListed : d),
    '2000-01-01',
  );
  const catalogueDate = new Date(newest);

  const staticRoutes: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    lastModified?: Date;
  }[] = [
    { path: '/', priority: 1, changeFrequency: 'daily', lastModified: catalogueDate },
    { path: '/buy', priority: 0.9, changeFrequency: 'daily', lastModified: catalogueDate },
    { path: '/rent', priority: 0.9, changeFrequency: 'daily', lastModified: catalogueDate },
    { path: '/land', priority: 0.8, changeFrequency: 'weekly', lastModified: catalogueDate },
    { path: '/sell', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/our-agents', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/mortgages', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: SITE_URL + r.path,
      lastModified: r.lastModified ?? now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),

    // Region and neighbourhood pages: the queries people actually type.
    ...REGIONS.map((region) => ({
      url: SITE_URL + '/trinidad/' + regionSlug(region),
      lastModified: catalogueDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...areasWithPages(listings).map((loc) => ({
      url: SITE_URL + '/areas/' + areaSlug(loc),
      lastModified: catalogueDate,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),

    // Listings carry their own dateListed: a truthful lastModified.
    ...listings.map((l) => ({
      url: SITE_URL + '/listings/' + l.slug,
      lastModified: new Date(l.dateListed),
      changeFrequency: 'weekly' as const,
      priority: l.featured ? 0.8 : 0.7,
      images: l.images.slice(0, 6).map(abs),
    })),

    ...getAgents().map((a) => ({
      url: SITE_URL + '/our-agents/' + a.slug,
      lastModified: catalogueDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
