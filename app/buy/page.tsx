import { abs, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo';
import type { Metadata } from 'next';
import ListingsBrowser from '@/components/ListingsBrowser';

export const metadata: Metadata = {
  title: 'Buy',
  description:
    'Houses, townhouses, apartments, land and commercial property for sale across San Fernando and South & Central Trinidad, priced in TTD.',
  alternates: { canonical: abs('/buy') },
  openGraph: {
    title: 'Buy · ' + SITE_NAME,
    description:
      'Houses, townhouses, apartments, land and commercial property for sale across San Fernando and South & Central Trinidad, priced in TTD.',
    url: abs('/buy'),
    siteName: SITE_NAME,
    locale: 'en_TT',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
};

export default function BuyPage() {
  return (
    <ListingsBrowser
      mode="Sale"
      title="Property for sale"
      intro="Houses, townhouses, apartments and commercial property, priced in TTD. Filter by area, type and budget, then book a viewing straight from the listing."
    />
  );
}
