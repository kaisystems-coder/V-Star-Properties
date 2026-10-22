import type { Listing } from '@/types/listing';
import { BRAND } from '@/components/Logo';
import { formatTTD } from './format';
import { VIEWING_REQUIREMENTS_ANSWER } from './viewing';

/**
 * Answer-engine optimisation: questions people ask about property here, with
 * answers derived from the live catalogue.
 *
 * AI search (Google AI Overviews, ChatGPT, Perplexity) quotes pages that lead
 * with a direct answer to a plainly worded question. Every answer below starts
 * with the fact itself and is computed from real listings, so it stays true as
 * stock changes and never invents area copy.
 */

export interface QA {
  q: string;
  a: string;
}

/** Common spellings people search for, where her data uses another. */
const AREA_ALIASES: Record<string, string> = {
  'La Romain': 'La Romaine',
  Phillipine: 'Philippine',
};

/** The name to put in headings: the spelling most searches use. */
export function areaDisplayName(location: string): string {
  return AREA_ALIASES[location] ?? location;
}

/** Other spellings worth stating once on the page, for search. */
export function areaAltName(location: string): string | undefined {
  return AREA_ALIASES[location] ? location : undefined;
}

export function areaSlug(location: string): string {
  return areaDisplayName(location)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Areas with enough stock to deserve their own page (no thin pages). */
export const AREA_MIN_LISTINGS = 3;

export function areasWithPages(listings: Listing[]): string[] {
  const counts = new Map<string, number>();
  listings.forEach((l) => counts.set(l.location, (counts.get(l.location) ?? 0) + 1));
  return [...counts.entries()]
    .filter(([, n]) => n >= AREA_MIN_LISTINGS)
    .sort((a, b) => b[1] - a[1])
    .map(([loc]) => loc);
}

export function locationFromAreaSlug(listings: Listing[], slug: string): string | undefined {
  return areasWithPages(listings).find((loc) => areaSlug(loc) === slug);
}

const isHome = (l: Listing) => l.propertyType !== 'Land' && l.propertyType !== 'Commercial';

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function range(nums: number[]): string {
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? formatTTD(min) : formatTTD(min) + ' to ' + formatTTD(max);
}

function plural(n: number, one: string, many: string) {
  return n + ' ' + (n === 1 ? one : many);
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

const CONTACT_LINE = `Call or WhatsApp ${BRAND.legalName} on ${BRAND.phone}, or email ${BRAND.email}.`;

/**
 * Quick answers for a place (a neighbourhood or a region), computed from the
 * listings in it. Questions with no data behind them are left out rather than
 * answered vaguely.
 */
export function placeFaq(place: string, listings: Listing[]): QA[] {
  const out: QA[] = [];
  const priced = (l: Listing) => l.price > 0;

  const homesForSale = listings.filter((l) => l.listingType === 'Sale' && isHome(l) && priced(l));
  if (homesForSale.length) {
    const prices = homesForSale.map((l) => l.price);
    out.push({
      q: `How much does a house cost in ${place}?`,
      a:
        `Homes for sale in ${place} with V-Star Properties are currently priced from ${range(prices)} TTD` +
        (homesForSale.length > 2 ? `, with a typical asking price around ${formatTTD(median(prices))}` : '') +
        `. That covers ${plural(homesForSale.length, 'listing', 'listings')} right now.`,
    });
  }

  const rentals = listings.filter((l) => l.listingType === 'Rent' && priced(l));
  if (rentals.length) {
    const rents = rentals.map((l) => l.price);
    const beds = rentals.map((l) => l.beds).filter((b): b is number => b !== null);
    out.push({
      q: `How much is rent in ${place}?`,
      a:
        `Rentals in ${place} currently run from ${range(rents)} TTD a month` +
        (rentals.length > 2 ? `, typically about ${formatTTD(median(rents))} a month` : '') +
        `, across ${plural(rentals.length, 'listing', 'listings')}` +
        (beds.length ? ` with ${Math.min(...beds)} to ${Math.max(...beds)} bedrooms` : '') +
        '.',
    });
  }

  const land = listings.filter((l) => l.propertyType === 'Land');
  if (land.length) {
    const landPriced = land.filter(priced).map((l) => l.price);
    out.push({
      q: `Is there land for sale in ${place}?`,
      a:
        `Yes. V-Star Properties has ${plural(land.length, 'parcel', 'parcels')} of land in ${place}` +
        (landPriced.length ? `, priced from ${range(landPriced)} TTD` : '') +
        '. The first $450,000 of a land-only purchase is exempt from stamp duty.',
    });
  }

  const types = new Map<string, number>();
  listings.forEach((l) => types.set(l.propertyType, (types.get(l.propertyType) ?? 0) + 1));
  if (listings.length) {
    out.push({
      q: `What property is available in ${place}?`,
      a:
        `V-Star Properties currently lists ${plural(listings.length, 'property', 'properties')} in ${place}: ` +
        list(
          [...types.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([t, n]) => plural(n, t.toLowerCase(), t === 'Land' ? 'land parcels' : t.toLowerCase() + 's')),
        ) +
        '.',
    });
  }

  out.push({
    q: `Who can I contact about property in ${place}?`,
    a: `${BRAND.legalName} handles sales and rentals in ${place}. ${CONTACT_LINE}`,
  });

  return out;
}

/** Site-wide questions, for /faq. Facts only: her own claims and verified T&T rules. */
export function generalFaq(listings: Listing[]): QA[] {
  const sale = listings.filter((l) => l.listingType === 'Sale').length;
  const rent = listings.filter((l) => l.listingType === 'Rent').length;
  const land = listings.filter((l) => l.propertyType === 'Land').length;

  return [
    {
      q: 'Who is V-Star Properties?',
      a: `${BRAND.legalName} is a full-service real estate brokerage based in San Fernando, Trinidad, with more than ten years of experience. It lists, markets and closes sales and rentals of houses, townhouses, apartments, land and commercial property.`,
    },
    {
      q: 'What areas does V-Star Properties cover?',
      a: 'Mainly South and Central Trinidad: San Fernando, La Romaine, Palmiste, Gulf View, Marabella, Bel Air, Philippine, Debe, Gasparillo, Couva and Chaguanas, with regular listings further north in Curepe, St. Joseph, Valsayn and Trincity.',
    },
    {
      q: 'How many properties does V-Star Properties have for sale and rent?',
      a: `${sale} properties for sale and ${rent} to rent right now, including ${land} parcels of land. Every price is in Trinidad and Tobago dollars (TTD).`,
    },
    {
      q: 'Does V-Star Properties handle rentals?',
      a: 'Yes. V-Star lists single and multi-family rental units, from studio apartments to furnished executive homes, and arranges leasing for landlords from listing to signature.',
    },
    {
      q: 'Does V-Star sell land and commercial property?',
      a: 'Yes. V-Star markets residential, agricultural and investment land, plus commercial retail, office and warehouse space, including property in the Point Lisas industrial area.',
    },
    {
      q: 'How do I book a viewing?',
      a: `Use the "Arrange a viewing" form on any listing, or ${CONTACT_LINE.charAt(0).toLowerCase() + CONTACT_LINE.slice(1)} Pre-screening with a valid ID is required before any viewing is scheduled, and a property for sale also needs a mortgage pre-approval or proof of funds.`,
    },
    {
      q: 'What documents do I need to view a property?',
      a: VIEWING_REQUIREMENTS_ANSWER,
    },
    {
      q: 'How do I sell or rent out my property with V-Star?',
      a: `Send the details through the Sell page on this site, or ${CONTACT_LINE.charAt(0).toLowerCase() + CONTACT_LINE.slice(1)} V-Star will talk through the price and how to market it, with no obligation to list.`,
    },
    {
      q: 'How much is stamp duty on a house in Trinidad and Tobago?',
      a: 'For a residential property with a house on it, the first $850,000 is exempt. Then 3% applies from $850,000 to $1,250,000, 5% from $1,250,000 to $1,750,000, and 7.5% above $1,750,000. The bands are marginal, so each rate applies only to the slice of the price inside its band.',
    },
    {
      q: 'Do first-time buyers pay stamp duty in Trinidad?',
      a: 'A first-time buyer of a home pays no stamp duty on a purchase up to $2,000,000 (Finance Act 2020, in force from 1 January 2021). For land only, the ordinary $450,000 exemption applies.',
    },
    {
      q: 'How much is stamp duty on land in Trinidad?',
      a: 'For residential land with no house, the first $450,000 is exempt, then 2% applies up to $650,000, 5% up to $850,000 and 7% above that, each on its own slice of the price.',
    },
    {
      q: 'What closing costs should I budget for when buying?',
      a: 'Besides the deposit, budget for stamp duty, attorney fees (usually a percentage of the price), a valuation fee if you take a mortgage, and stamp duty on the mortgage deed of 0.2% above $450,000. The Mortgages page on this site works out all of these for a given price.',
    },
  ];
}

export function faqSchema(items: QA[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': url + '#faq',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}
