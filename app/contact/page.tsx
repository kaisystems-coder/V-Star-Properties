import { abs, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/seo';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ContactForm from '@/components/ContactForm';
import { BRAND, SocialIcon } from '@/components/Logo';
import { getAgents } from '@/lib/agents';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Call, WhatsApp or email V-Star Properties in San Fernando about buying, selling or renting across South and Central Trinidad.',
  alternates: { canonical: abs('/contact') },
  openGraph: {
    title: 'Contact · ' + SITE_NAME,
    description:
      'Call, WhatsApp or email V-Star Properties in San Fernando about buying, selling or renting across South and Central Trinidad.',
    url: abs('/contact'),
    siteName: SITE_NAME,
    locale: 'en_TT',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  const agents = getAgents();

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to V-Star"
        intro="Ask about a listing, book a viewing, or tell us about a property you want to sell or rent out. Call or WhatsApp for the fastest reply."
      />

      <section className="mx-auto max-w-[82rem] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="rounded-sm border border-mist-edge bg-mist p-6 shadow-raise sm:p-8">
            <ContactForm />
          </div>

          <div className="flex flex-col gap-10">
            <div>
              <h2 className="font-display text-[1.35rem] tracking-display text-ink">
                Get in touch
              </h2>
              <div aria-hidden className="mt-3.5 h-[3px] w-12 rounded-full bg-accent" />
              <address className="mt-4 not-italic text-[0.95rem] leading-[1.75] text-ink-mute">
                {BRAND.legalName}
                <br />
                {BRAND.address}
              </address>
              <div className="mt-2 flex flex-col text-[0.95rem] sm:mt-4 sm:gap-1.5">
                <a
                  href={'tel:' + BRAND.phone.replace(/[^+\d]/g, '')}
                  className="flex min-h-11 items-center text-ink transition-colors duration-200 ease-out hover:text-accent-deep desk:min-h-0"
                >
                  {BRAND.phone}
                </a>
                <a
                  href={'mailto:' + BRAND.email}
                  className="flex min-h-11 items-center break-all text-ink transition-colors duration-200 ease-out hover:text-accent-deep desk:min-h-0"
                >
                  {BRAND.email}
                </a>
              </div>
            </div>

            <div>
              <h2 className="font-display text-[1.35rem] tracking-display text-ink">
                Follow the listings
              </h2>
              <div aria-hidden className="mt-3.5 h-[3px] w-12 rounded-full bg-accent" />
              <p className="mt-4 text-[0.92rem] leading-relaxed text-ink-mute">
                New properties go up on Facebook and Instagram first.
              </p>
              <ul className="mt-3 flex flex-col">
                {BRAND.socials.map((s) => (
                  <li key={s.id} className="border-b border-mist-edge last:border-b-0">
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-11 items-center gap-3 py-2.5 transition-colors duration-200 ease-out active:translate-y-px"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand-deep transition-colors duration-200 ease-out group-hover:bg-brand-deep group-hover:text-mist">
                        <SocialIcon id={s.id} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.92rem] font-bold text-ink">{s.label}</span>
                        <span className="block truncate text-[0.8rem] text-ink-mute">{s.handle}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-[1.35rem] tracking-display text-ink">
                Your agent
              </h2>
              <div aria-hidden className="mt-3.5 h-[3px] w-12 rounded-full bg-accent" />
              <ul className="mt-4 flex flex-col">
                {agents.map((agent) => (
                  <li key={agent.id} className="border-b border-mist-edge last:border-b-0">
                    <Link
                      href={'/our-agents/' + agent.slug}
                      className="group flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block text-[0.92rem] text-ink transition-colors duration-200 ease-out group-hover:text-accent-deep">
                          {agent.name}
                        </span>
                        <span className="mt-0.5 block text-[0.78rem] text-ink-faint">
                          {agent.territories.join(' · ')}
                        </span>
                      </span>
                      <span className="tnum shrink-0 text-[0.82rem] text-ink-mute">
                        {agent.phone.replace('+1 (868) ', '')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
