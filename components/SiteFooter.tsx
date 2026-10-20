import Link from 'next/link';
import Logo, { BRAND, SocialIcon } from './Logo';
import { NAV_LINKS, UTILITY_NAV } from '@/lib/nav';
import { REGIONS } from '@/lib/filters';
import { regionSlug } from '@/lib/regions';
import type { Listing } from '@/types/listing';
import { areaDisplayName, areaSlug, areasWithPages } from '@/lib/aeo';

export default function SiteFooter({ listings }: { listings: Listing[] }) {
  return (
    <footer className="on-ink mt-24 bg-ink text-mist">
      <div className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-[26rem]">
            <Logo tone="mist" />
            <p className="mt-5 font-serif text-[1.02rem] italic leading-relaxed text-mist/80">
              &ldquo;{BRAND.tagline}.&rdquo;
            </p>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-mist/60">
              Sales, rentals and land across San Fernando and South and Central
              Trinidad, from {BRAND.legalName}.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="V-Star on social media">
              {BRAND.socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label + ' (opens in a new tab)'}
                    className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-mist/15 px-3 text-[0.82rem] text-mist/80 transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent/60 hover:bg-mist/5 hover:text-accent active:scale-[0.97]"
                  >
                    <SocialIcon id={s.id} />
                    <span>{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[auto_auto_minmax(8rem,auto)_auto] lg:gap-12">
            <div>
              <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-mist/70">
                Browse
              </h2>
              {/* Footer links carry a 44px touch height on phones, where they
                  are the only navigation in reach, and return to a tight
                  printed rhythm from sm up. */}
              <ul className="mt-1 flex flex-col text-[0.9rem] sm:mt-3 sm:gap-1.5">
                {NAV_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center text-mist/75 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/faq"
                    className="flex min-h-11 items-center text-mist/75 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Region links. These are how the area pages get crawled — an
                orphaned page that only the sitemap knows about carries far
                less weight than one linked from every page on the site. */}
            <div>
              <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-mist/70">
                Areas
              </h2>
              <ul className="mt-1 flex flex-col text-[0.9rem] sm:mt-3 sm:gap-1.5">
                {REGIONS.map((region) => (
                  <li key={region}>
                    <Link
                      href={'/trinidad/' + regionSlug(region)}
                      className="flex min-h-11 items-center text-mist/75 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0"
                    >
                      {region}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-mist/70">
                Office
              </h2>
              <address className="mt-3 not-italic text-[0.9rem] leading-relaxed text-mist/75">
                {BRAND.address}
              </address>
            </div>
            <div>
              <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-mist/70">
                Contact
              </h2>
              <div className="mt-1 flex flex-col text-[0.9rem] sm:mt-3 sm:gap-1.5">
                <a
                  href={'tel:' + BRAND.phone.replace(/[^+\d]/g, '')}
                  className="flex min-h-11 items-center text-mist/75 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0"
                >
                  {BRAND.phone}
                </a>
                <a
                  href={'https://wa.me/' + BRAND.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2 text-mist/75 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0"
                >
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="shrink-0"
                  >
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z" />
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={'mailto:' + BRAND.email}
                  className="flex min-h-11 items-center whitespace-nowrap text-mist/75 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0"
                >
                  {BRAND.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Neighbourhood pages, linked from every page so each one is a
            crawlable, internally linked landing page. */}
        <nav aria-label="Popular areas" className="mt-12 border-t border-mist/12 pt-8">
          <h2 className="text-[0.68rem] uppercase tracking-[0.2em] text-mist/70">Popular areas</h2>
          <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
            {areasWithPages(listings).map((loc) => (
              <li key={loc}>
                <Link
                  href={'/areas/' + areaSlug(loc)}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-[0.88rem] text-mist/75 transition-[background-color,color] duration-200 ease-out hover:bg-mist/10 hover:text-accent active:scale-[0.97] desk:min-h-0 desk:py-1"
                >
                  {areaDisplayName(loc)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 flex flex-col gap-3 border-t border-mist/12 pt-6 text-[0.78rem] text-mist/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.legalName}. San Fernando, Trinidad &amp; Tobago.
          </p>
          {/* The listing manager sits here rather than in the ribbon: it
              belongs to the agency, not to a visitor, and the ribbon is full
              at nine public tabs. Still unauthenticated by design for the
              pitch. */}
          <div className="flex items-center gap-5">
            <p>Preview site.</p>
            {UTILITY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-mist/55 transition-colors duration-300 ease-out hover:text-accent desk:min-h-0 desk:min-w-0 desk:justify-start desk:px-0"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
