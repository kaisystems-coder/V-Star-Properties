import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import QuickAnswers from '@/components/QuickAnswers';
import { BRAND } from '@/components/Logo';
import { getListings } from '@/lib/listings';
import { faqSchema, generalFaq } from '@/lib/aeo';
import { abs, breadcrumbSchema, DEFAULT_OG_IMAGE, jsonLd, SITE_NAME } from '@/lib/seo';

const DESCRIPTION =
  'Answers about buying, renting and selling property in San Fernando and South Trinidad with V-Star Properties: areas covered, viewings, stamp duty and closing costs.';

export const metadata: Metadata = {
  title: 'Questions about buying, renting & selling in Trinidad',
  description: DESCRIPTION,
  alternates: { canonical: abs('/faq') },
  openGraph: {
    title: 'Questions & answers · ' + SITE_NAME,
    description: DESCRIPTION,
    url: abs('/faq'),
    siteName: SITE_NAME,
    locale: 'en_TT',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
};

export default async function FaqPage() {
  const items = generalFaq(await getListings());

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqSchema(items, abs('/faq')))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Questions', path: '/faq' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Questions"
        title="Buying, renting and selling, answered"
        intro="What people ask V-Star most often, from which areas we cover to how stamp duty works in Trinidad and Tobago."
      />

      <QuickAnswers title="Frequently asked questions" items={items} id="faq" />

      <section className="mx-auto max-w-[82rem] px-5 pb-6 sm:px-8">
        <div className="flex flex-col gap-5 rounded-sm bg-brand-wash p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-[40rem] text-[1rem] leading-[1.7] text-ink-soft">
            Not answered here? Ask directly. Call or WhatsApp {BRAND.phone}.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={'https://wa.me/' + BRAND.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-sm bg-brand-deep px-5 text-[0.9rem] font-bold text-mist transition-[background-color,transform] duration-200 ease-out hover:bg-ink active:translate-y-px"
            >
              WhatsApp V-Star
            </a>
            <Link
              href="/mortgages"
              className="inline-flex min-h-11 items-center rounded-sm border border-brand-deep/40 px-5 text-[0.9rem] text-brand-deep transition-[background-color,border-color,transform] duration-200 ease-out hover:border-brand-deep hover:bg-mist active:translate-y-px"
            >
              Work out closing costs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
