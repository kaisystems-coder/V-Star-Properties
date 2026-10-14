'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Listing } from '@/types/listing';
import { BLUR_DATA_URL, formatPrice, specLedger } from '@/lib/format';
import { useReveal, revealUp, staggerChildren } from '@/lib/use-reveal';

/**
 * Featured properties.
 *
 * Below lg this is a scroll-snapped rail of wide plates, which is the right
 * shape for a thumb. From lg up it becomes a three-column grid: there are only
 * ever three featured properties, and a rail wide enough to need scrolling on
 * a desktop left the third plate sliced by the viewport edge, which reads as a
 * broken layout rather than as an invitation to scroll.
 */
export default function FeaturedRail({ listings }: { listings: Listing[] }) {
  const reveal = useReveal();

  if (listings.length === 0) return null;

  return (
    <section className="mx-auto max-w-[82rem] px-5 pt-16 sm:px-8 sm:pt-20">
      <motion.div
        {...reveal}
        variants={revealUp}
        className="flex items-end justify-between gap-6 border-b border-mist-edge pb-5"
      >
        <div>
          <h2 className="font-display text-[1.7rem] tracking-display text-ink sm:text-[2rem]">
            This month&rsquo;s selection
          </h2>
          <p className="mt-1.5 max-w-[34rem] text-[0.92rem] leading-relaxed text-ink-mute">
            New to the books and worth a first look.
          </p>
        </div>
        <p className="tnum hidden shrink-0 text-[0.78rem] uppercase tracking-[0.16em] text-ink-faint sm:block">
          {listings.length} featured
        </p>
      </motion.div>

      <motion.div
        {...reveal}
        variants={staggerChildren(0.1)}
        // `scroll-p*` rather than plain padding: a horizontal scroll container
        // consumes its own inline padding as scroll offset, so `px-5` alone
        // left the first card flush against the screen edge and its spec
        // ledger bleeding off both sides at 320px. Scroll padding keeps the
        // snap position inset instead, and the cards carry the real gutter.
        className="hide-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:gap-6 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:scroll-px-0"
      >
        {listings.map((listing, i) => {
          const specs = specLedger(listing).slice(0, 3);
          return (
            <motion.article
              key={listing.id}
              variants={revealUp}
              // Width is measured off the gutter rather than a flat vw, so the
              // card can never exceed the space between the rail's insets. The
              // 3rem it gives back is the peek that shows a second card is
              // there; a flat 88vw overflowed the container at 320px and left
              // the neighbour's ledger crowding the screen edge.
              className="group w-[min(calc(100vw-2.5rem-3rem),34rem)] shrink-0 snap-start lg:w-auto lg:shrink"
            >
              <Link href={'/listings/' + listing.slug} className="block">
                {/* 16:10 suits the wide plate in the rail; at three-up that
                    leaves only ~250px of height for a three-line overlay, so
                    the grid takes a taller crop. */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-mist-deep lg:aspect-[4/3]">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title + ', ' + listing.location}
                    fill
                    priority={i === 0}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 34rem, 27rem"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                  />
                  {/* The scrim has to carry white type over a bright midday
                      photograph, so it is opaque at the foot and reaches
                      roughly halfway up rather than fading from the very top. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 via-45% to-transparent"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-brand/10 mix-blend-multiply"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    {/* One line only. At three-up the plate is 250px tall and
                        "Location · Region" wraps to two lines, which pushes
                        the title down into the price. */}
                    <p className="truncate text-[0.66rem] uppercase tracking-[0.18em] text-accent">
                      {listing.location}
                    </p>
                    <h3 className="mt-1.5 font-display text-[1.35rem] leading-[1.15] tracking-display text-mist lg:text-[1.4rem]">
                      {listing.title}
                    </h3>
                    <p className="tnum mt-1.5 text-[1rem] text-mist/85">
                      {formatPrice(listing)}
                    </p>
                  </div>
                </div>
              </Link>

              <dl className="ledger mt-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex-1 py-2.5 pl-3 first:pl-0">
                    <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint sm:text-[0.6rem]">
                      {spec.label}
                    </dt>
                    <dd className="tnum mt-0.5 text-[0.95rem] text-ink-soft sm:text-[0.92rem]">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
