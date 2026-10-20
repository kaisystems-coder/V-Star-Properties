import { abs, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/components/Logo';
import { BLUR_DATA_URL } from '@/lib/format';
import { getAgents } from '@/lib/agents';
import { getListings } from '@/lib/listings';
import AgentFeature from '@/components/AgentFeature';

export const metadata: Metadata = {
  title: 'About',
  description:
    'V-Star Properties Company Limited: a full-service real estate brokerage in San Fernando with more than ten years of experience across South and Central Trinidad.',
  alternates: { canonical: abs('/about') },
  openGraph: {
    title: 'About · ' + SITE_NAME,
    description:
      'V-Star Properties Company Limited: a full-service real estate brokerage in San Fernando with more than ten years of experience across South and Central Trinidad.',
    url: abs('/about'),
    siteName: SITE_NAME,
    locale: 'en_TT',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
};

/**
 * What V-Star handles, from the client's own breakdown of the business.
 */
const SERVICES = [
  {
    title: 'Residential',
    body: 'Listing, marketing and closing sales of standalone houses, townhouses and executive apartments, plus single and multi-family rentals.',
  },
  {
    title: 'Commercial & land',
    body: 'Retail, office and warehouse space, and plots of residential, agricultural and investment-grade land.',
  },
  {
    title: 'Niche & investment',
    body: 'Upscale executive homes, multi-family investment assets and discounted fixer-uppers bought for development.',
  },
];

/** Her "Why choose us" list, as it appears on her current site. */
const REASONS = [
  'Honest and professional agents',
  'A wide network of clients',
  'Knowledgeable, with over ten years of experience',
  'Individual attention',
  'Motivated and dynamic professionals',
  'Efficient and reliable service',
];

const FACTS = [
  { figure: '10+', label: 'Years of experience' },
  { figure: '21k', label: 'Facebook followers' },
  { figure: 'South', label: 'Based in San Fernando' },
  { figure: 'TTD', label: 'Everything priced in' },
];

export default async function AboutPage() {
  const agents = getAgents();

  return (
    <>
      <section className="on-ink relative isolate overflow-hidden bg-ink">
        <div className="grain absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=2000&q=74"
            alt=""
            aria-hidden
            fill
            priority
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/35"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/50"
          />
          <div aria-hidden className="absolute inset-0 bg-ink/20 mix-blend-multiply" />
        </div>

        <div className="relative mx-auto max-w-[82rem] px-5 pb-14 pt-[9rem] sm:px-8 sm:pb-16 sm:pt-[10.5rem]">
          <div className="max-w-[42rem]">
            <p className="text-[0.72rem] uppercase tracking-[0.24em] text-accent">
              About V-Star
            </p>
            <h1 className="mt-4 font-display text-[2.4rem] leading-[1.05] tracking-display text-mist sm:text-[3.2rem]">
              Built on trust.
              <span className="block font-serif font-normal italic tracking-[-0.01em] text-accent">
                Designed for confidence.
              </span>
            </h1>
            <p className="mt-5 max-w-[36rem] text-[1rem] leading-[1.7] text-mist/75">
              {BRAND.legalName} is a full-service brokerage in San Fernando,
              buying, selling and leasing homes, land and commercial property
              across South and Central Trinidad.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-mist-edge">
        <div className="mx-auto max-w-[82rem] px-5 py-10 sm:px-8">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint">
                  {fact.label}
                </dt>
                <dd className="tnum mt-2 font-display text-[1.9rem] leading-none tracking-display text-ink">
                  {fact.figure}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="font-display text-[1.8rem] leading-tight tracking-display text-ink sm:text-[2.1rem]">
              More than ten years of meeting our clients&rsquo; demands
            </h2>
            <div aria-hidden className="mt-5 h-[3px] w-16 rounded-full bg-accent" />
            <div className="mt-6 flex flex-col gap-4 text-[0.98rem] leading-[1.75] text-ink-mute">
              <p>
                {BRAND.legalName} is known for a broad network and brings
                excellent personal and communication skills to the table. That
                paves the way for smooth and stress-free transactions.
              </p>
              <p>
                Working with V-Star guarantees confidentiality and
                trustworthiness, and individual attention that makes for a
                personal journey whether you are buying, selling or renting.
                We work hard, and listen to each client&rsquo;s wants and needs
                to reach the best outcome.
              </p>
              <p className="font-serif text-[1.15rem] italic leading-snug text-brand-deep">
                &ldquo;{BRAND.tagline}.&rdquo;
              </p>
            </div>

            <h3 className="mt-10 font-display text-[1.2rem] tracking-display text-ink">
              Why choose us
            </h3>
            <ul className="mt-4 grid gap-x-6 sm:grid-cols-2">
              {REASONS.map((r) => (
                <li
                  key={r}
                  className="flex items-center gap-2.5 border-b border-mist-edge py-3 text-[0.94rem] text-ink-soft"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden className="shrink-0 text-brand-deep">
                    <path d="M2.5 7l2.8 2.8L10.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-[1.5rem] tracking-display text-ink">
              What we handle
            </h2>
            <ul className="mt-5 flex flex-col">
              {SERVICES.map((s) => (
                <li key={s.title} className="border-b border-mist-edge py-6 first:pt-0 last:border-b-0">
                  <h3 className="font-display text-[1.2rem] leading-snug tracking-display text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[0.94rem] leading-[1.7] text-ink-mute">{s.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-sm bg-brand-wash p-6">
              <h3 className="font-display text-[1.05rem] tracking-display text-ink">Where we work</h3>
              <p className="mt-2 text-[0.94rem] leading-[1.7] text-ink-soft">
                Based in San Fernando, with most listings in the communities
                around San Fernando, La Romaine, Palmiste, Bel Air, Phillipine
                and Debe, and regular listings north through Curepe, St. Joseph
                and Trincity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-mist-edge bg-mist-deep/40">
        <div className="mx-auto max-w-[82rem] px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="font-display text-[1.7rem] tracking-display text-ink sm:text-[2rem]">
            Who you would be dealing with
          </h2>
          <p className="mt-2 max-w-[36rem] text-[0.94rem] leading-relaxed text-ink-mute">
            One agent, responsible for every file from listing through to closing.
          </p>
          <div className="mt-8">
            <AgentFeature agent={agents[0]} listings={await getListings()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-6 rounded-sm border border-mist-edge bg-mist p-7 shadow-raise sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[36rem]">
            <h2 className="font-display text-[1.6rem] leading-tight tracking-display text-ink sm:text-[1.9rem]">
              Talk to us about your property
            </h2>
            <p className="mt-2.5 text-[0.95rem] leading-[1.7] text-ink-mute">
              Call, WhatsApp or email. Based in {BRAND.address}, serving
              South and Central Trinidad.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-sm bg-brand-deep px-5 py-3 text-[0.9rem] font-bold text-mist transition-[background-color,transform] duration-200 ease-out hover:bg-ink active:translate-y-px"
            >
              Contact V-Star
            </Link>
            <a
              href={'tel:' + BRAND.phone.replace(/[^+\d]/g, '')}
              className="rounded-sm border border-ink/15 px-5 py-3 text-[0.9rem] text-ink transition-[background-color,border-color,transform] duration-200 ease-out hover:border-ink/30 hover:bg-mist-deep active:translate-y-px"
            >
              {BRAND.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
