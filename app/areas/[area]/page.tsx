import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_LISTINGS } from '@/lib/mock-listings';
import { getAgents } from '@/lib/agents';
import { regionSlug } from '@/lib/regions';
import { formatTTD } from '@/lib/format';
import {
  areaAltName,
  areaDisplayName,
  areaSlug,
  areasWithPages,
  faqSchema,
  locationFromAreaSlug,
  placeFaq,
} from '@/lib/aeo';
import {
  abs,
  breadcrumbSchema,
  itemListSchema,
  jsonLd,
  ogImage,
  shareImage,
  SITE_NAME,
} from '@/lib/seo';
import PageHeader from '@/components/PageHeader';
import ListingCard from '@/components/ListingCard';
import AgentFeature from '@/components/AgentFeature';
import QuickAnswers from '@/components/QuickAnswers';

/**
 * A neighbourhood landing page: /areas/la-romaine, /areas/palmiste…
 *
 * People search by neighbourhood ("houses for rent in La Romaine"), one level
 * below the regions. Only areas with enough stock get a page, and everything
 * on it is derived from her listings, so none of them is a thin doorway page.
 * A server component: the whole page is in the HTML a crawler receives.
 */

export function generateStaticParams() {
  return areasWithPages(MOCK_LISTINGS).map((loc) => ({ area: areaSlug(loc) }));
}

export const dynamicParams = false;

function load(slug: string) {
  const location = locationFromAreaSlug(MOCK_LISTINGS, slug);
  if (!location) return null;
  const listings = MOCK_LISTINGS.filter((l) => l.location === location);
  const name = areaDisplayName(location);
  const sale = listings.filter((l) => l.listingType === 'Sale');
  const rent = listings.filter((l) => l.listingType === 'Rent');
  return { location, name, listings, sale, rent, region: listings[0].region };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const d = load(area);
  if (!d) return {};

  const what =
    d.sale.length && d.rent.length ? 'for Sale & Rent' : d.sale.length ? 'for Sale' : 'for Rent';
  const title = `Houses & Property ${what} in ${d.name}, Trinidad`;
  const salePrices = d.sale.filter((l) => l.price > 0).map((l) => l.price);
  const description =
    `${d.listings.length} properties in ${d.name}, ${d.region}: ` +
    [d.sale.length && `${d.sale.length} for sale`, d.rent.length && `${d.rent.length} to rent`]
      .filter(Boolean)
      .join(', ') +
    (salePrices.length ? `, sale prices from ${formatTTD(Math.min(...salePrices))}` : '') +
    '. Photos, prices in TTD and viewings with V-Star Properties.';
  const path = '/areas/' + area;
  const hero = d.listings[0].images[0];

  return {
    title,
    description,
    keywords: [
      `houses for sale ${d.name}`,
      `houses for rent ${d.name}`,
      `apartments for rent ${d.name}`,
      `land for sale ${d.name}`,
      `${d.name} real estate`,
      `${d.name} Trinidad property`,
      ...(areaAltName(d.location) ? [`${d.location} houses for sale`] : []),
    ],
    alternates: { canonical: abs(path) },
    openGraph: {
      title: title + ' · ' + SITE_NAME,
      description,
      url: abs(path),
      siteName: SITE_NAME,
      locale: 'en_TT',
      type: 'website',
      images: [ogImage(shareImage(abs(hero)), 'Property in ' + d.name)],
    },
    twitter: {
      card: 'summary_large_image',
      title: title + ' · ' + SITE_NAME,
      description,
      images: [shareImage(abs(hero))],
    },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const d = load(area);
  if (!d) notFound();

  const path = '/areas/' + area;
  const faq = placeFaq(d.name, d.listings);
  const alt = areaAltName(d.location);
  const agent = getAgents()[0];
  const salePrices = d.sale.filter((l) => l.price > 0).map((l) => l.price);
  const rents = d.rent.filter((l) => l.price > 0).map((l) => l.price);

  // Sibling areas in the same region first, so the cluster links up.
  const siblings = areasWithPages(MOCK_LISTINGS).filter((loc) => loc !== d.location);
  const sameRegion = siblings.filter((loc) => MOCK_LISTINGS.find((l) => l.location === loc)?.region === d.region);
  const others = siblings.filter((loc) => !sameRegion.includes(loc));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: d.region, path: '/trinidad/' + regionSlug(d.region) },
            { name: d.name, path },
          ]),
        )}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(itemListSchema(d.listings, path))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(faq, abs(path)))} />

      <PageHeader
        eyebrow={d.region}
        title={'Property in ' + d.name}
        intro={
          `${d.listings.length} properties on the books in ${d.name}` +
          (alt ? ` (also spelt ${alt})` : '') +
          `, ${d.region}. Every listing priced in TTD, with viewings arranged directly with V-Star Properties.`
        }
        meta={
          salePrices.length
            ? 'Sale prices from ' + formatTTD(Math.min(...salePrices)) + ' to ' + formatTTD(Math.max(...salePrices))
            : rents.length
              ? 'Rents from ' + formatTTD(Math.min(...rents)) + ' to ' + formatTTD(Math.max(...rents)) + ' a month'
              : undefined
        }
      />

      <section className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-14">
        {d.sale.length > 0 && (
          <>
            <h2 className="font-display text-[1.7rem] tracking-display text-ink sm:text-[2rem]">
              For sale in {d.name}
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {d.sale.map((l, i) => (
                <ListingCard key={l.id} listing={l} priority={i < 2} />
              ))}
            </div>
          </>
        )}
        {d.rent.length > 0 && (
          <>
            <h2
              className={
                'font-display text-[1.7rem] tracking-display text-ink sm:text-[2rem] ' +
                (d.sale.length ? 'mt-16' : '')
              }
            >
              To rent in {d.name}
            </h2>
            <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {d.rent.map((l, i) => (
                <ListingCard key={l.id} listing={l} priority={!d.sale.length && i < 2} />
              ))}
            </div>
          </>
        )}
      </section>

      <QuickAnswers title={'Property in ' + d.name + ': quick answers'} items={faq} />

      {agent && (
        <section className="border-t border-mist-edge bg-mist-deep/40">
          <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-14">
            <h2 className="font-display text-[1.7rem] tracking-display text-ink sm:text-[2rem]">
              Your agent for {d.name}
            </h2>
            <div className="mt-7">
              <AgentFeature agent={agent} listings={MOCK_LISTINGS} headingLevel="h3" />
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-mist-edge">
        <div className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-14">
          <h2 className="font-display text-[1.35rem] tracking-display text-ink">Nearby areas</h2>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {[...sameRegion, ...others].map((loc) => (
              <li key={loc}>
                <Link
                  href={'/areas/' + areaSlug(loc)}
                  className="inline-flex min-h-11 items-center rounded-sm border border-mist-edge bg-mist px-4 text-[0.88rem] text-ink-mute transition-[background-color,border-color,color] duration-200 ease-out hover:border-brand/60 hover:text-ink active:translate-y-px desk:min-h-0 desk:py-2"
                >
                  {areaDisplayName(loc)}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={'/trinidad/' + regionSlug(d.region)}
                className="inline-flex min-h-11 items-center rounded-sm border border-brand-deep/40 bg-brand-wash px-4 text-[0.88rem] text-brand-deep transition-[background-color,border-color] duration-200 ease-out hover:border-brand-deep active:translate-y-px desk:min-h-0 desk:py-2"
              >
                All of {d.region}
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
