import type { Metadata, Viewport } from 'next';
import { Lato, Tinos } from 'next/font/google';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getListings } from '@/lib/listings';
import { ListingsProvider } from '@/lib/listings-context';
import {
  DEFAULT_OG_IMAGE,
  jsonLd,
  ogImage,
  OFFICE_GEO,
  organisationSchema,
  websiteSchema,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo';

/**
 * Type from the V-Star brand guide: Lato throughout (Heavy for H1, Bold for
 * headings, Regular for body) and Liberation Serif for brand lines and quotes.
 * Tinos is Liberation Serif's web build: same outlines, served by Google.
 */
// One Lato load serves both roles (two instances fetched Lato 700 twice).
const sans = Lato({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700', '900'],
  variable: '--font-sans',
});

const serif = Tinos({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const DESCRIPTION =
  'V-Star Properties Company Limited, San Fernando. Houses, townhouses, apartments, land and commercial property for sale and rent across South and Central Trinidad.';

export const metadata: Metadata = {
  // Makes every relative URL in metadata below resolve to an absolute one,
  // which OpenGraph requires — a relative og:image is ignored outright.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'V-Star Properties | Houses for Sale & Rent in San Fernando',
    template: '%s · ' + SITE_NAME,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'V-Star Properties Company Limited', url: SITE_URL }],
  creator: 'V-Star Properties Company Limited',
  publisher: 'V-Star Properties Company Limited',
  keywords: [
    'V-Star Properties',
    'real estate San Fernando',
    'houses for sale San Fernando Trinidad',
    'houses for sale South Trinidad',
    'apartments for rent San Fernando',
    'houses for rent La Romaine',
    'townhouses for sale Trinidad',
    'land for sale South Trinidad',
    'property for sale Palmiste',
    'Gulf View houses for sale',
    'real estate agent San Fernando',
    'Trinidad real estate',
    'property Trinidad and Tobago',
  ],
  alternates: { canonical: '/', languages: { 'en-TT': '/' } },
  // Phone numbers are tap-to-call links already; stop iOS styling every
  // price and lot size as a phone number.
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: true, title: 'V-Star', statusBarStyle: 'default' },
  // Search Console / Bing Webmaster verification, set per environment.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { other: { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
      : {}),
  },
  // Local search signals: the office is in San Fernando.
  other: {
    'geo.region': 'TT-SFO',
    'geo.placename': 'San Fernando, Trinidad and Tobago',
    'geo.position': OFFICE_GEO.lat + ';' + OFFICE_GEO.lng,
    ICBM: OFFICE_GEO.lat + ', ' + OFFICE_GEO.lng,
  },
  // In Trinidad property circulates on WhatsApp, which reads OpenGraph. With
  // no og tags a shared listing renders as a bare grey link and the agency
  // loses the click.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_TT',
    url: SITE_URL,
    title: 'V-Star Properties | Houses for Sale & Rent in San Fernando',
    description: DESCRIPTION,
    // The hero photograph. Without an og:image a link shared on WhatsApp
    // renders as a bare grey row and loses the tap.
    images: [ogImage(DEFAULT_OG_IMAGE, SITE_NAME + ' — property across Trinidad & Tobago')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'V-Star Properties | Houses for Sale & Rent in San Fernando',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'real estate',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Never cap zoom: people pinch into listing photos.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#203546' },
  ],
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Her published listings, cached and tag-revalidated (lib/listings.ts).
  const listings = await getListings();
  return (
    <html lang="en-TT" className={sans.variable + ' ' + serif.variable}>
      <body className="font-sans antialiased">
        {/* The agency, as a RealEstateAgent. Emitted once here rather than per
            page so every page inherits one canonical @id to reference. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(organisationSchema())}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(websiteSchema())}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-mist"
        >
          Skip to content
        </a>
        <ListingsProvider listings={listings}>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter listings={listings} />
        </ListingsProvider>
        <WhatsAppButton />
      </body>
    </html>
  );
}
