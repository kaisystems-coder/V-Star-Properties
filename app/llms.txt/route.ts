import { MOCK_LISTINGS } from '@/lib/mock-listings';
import { BRAND } from '@/components/Logo';
import { REGIONS } from '@/lib/filters';
import { regionSlug } from '@/lib/regions';
import { areaDisplayName, areaSlug, areasWithPages } from '@/lib/aeo';
import { formatPrice } from '@/lib/format';
import { SITE_URL } from '@/lib/seo';

/**
 * /llms.txt: a plain-text map of the site for AI assistants (llmstxt.org).
 *
 * When someone asks ChatGPT or Perplexity for "houses for rent in La Romaine",
 * this gives the model the agency, its contact details and the current
 * listings with prices in one fetch, built from the same data as the pages.
 */
export const dynamic = 'force-static';

export function GET() {
  const L = MOCK_LISTINGS;
  const sale = L.filter((l) => l.listingType === 'Sale');
  const rent = L.filter((l) => l.listingType === 'Rent');
  const line = (l: (typeof L)[number]) =>
    `- [${l.title}](${SITE_URL}/listings/${l.slug}): ${l.propertyType}, ${l.location}, ${formatPrice(l)}` +
    (l.beds ? `, ${l.beds} bed` : '') +
    (l.baths ? `, ${l.baths} bath` : '') +
    (l.lotSize ? `, lot ${l.lotSize}` : '');

  const body = `# ${BRAND.legalName}

> Full-service real estate brokerage in San Fernando, Trinidad and Tobago, with more than ten years of experience. Sales and rentals of houses, townhouses, apartments, land and commercial property across South and Central Trinidad. All prices in Trinidad and Tobago dollars (TTD).

- Phone and WhatsApp: ${BRAND.phone}
- Email: ${BRAND.email}
- Office: ${BRAND.address}
${BRAND.socials.map((s) => `- ${s.label}: ${s.href}`).join('\n')}

## Main pages

- [Property for sale](${SITE_URL}/buy): ${sale.length} listings
- [Property to rent](${SITE_URL}/rent): ${rent.length} listings
- [Land for sale](${SITE_URL}/land)
- [Agent profile with every listing](${SITE_URL}/our-agents/v-star-properties)
- [Sell or rent out your property](${SITE_URL}/sell)
- [Questions and answers](${SITE_URL}/faq): areas covered, viewings, stamp duty, closing costs
- [Mortgage and closing-cost calculators](${SITE_URL}/mortgages)
- [About](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)

## Areas

${REGIONS.map((r) => `- [${r}](${SITE_URL}/trinidad/${regionSlug(r)})`).join('\n')}
${areasWithPages(L)
  .map((loc) => `- [${areaDisplayName(loc)}](${SITE_URL}/areas/${areaSlug(loc)})`)
  .join('\n')}

## Listings for sale

${sale.map(line).join('\n')}

## Listings to rent (monthly)

${rent.map(line).join('\n')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
