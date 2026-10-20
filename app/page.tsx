'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useListings } from '@/lib/listings-context';
import { getAgents } from '@/lib/agents';
import Hero from '@/components/Hero';
import FeaturedRail from '@/components/FeaturedRail';
import AgentCard from '@/components/AgentCard';
import AgentFeature from '@/components/AgentFeature';
import SectionHeading from '@/components/SectionHeading';
import CalculatorTeaser from '@/components/CalculatorTeaser';
import QuickAnswers from '@/components/QuickAnswers';
import { generalFaq } from '@/lib/aeo';
import { useReveal, revealUp, staggerChildren } from '@/lib/use-reveal';

/**
 * The landing page.
 *
 * Browsing lives on /buy, /rent and /land, so this page's job is to point at
 * them: what the agency has, who works there, and the one tool that gets a
 * hesitant buyer to engage before they are ready to call anyone.
 */
export default function HomePage() {
  const listings = useListings();
  const agents = getAgents();
  const routeReveal = useReveal();
  const agentsReveal = useReveal();
  const closingReveal = useReveal();

  const featured = useMemo(
    () => listings.filter((l) => l.featured).slice(0, 3),
    [listings],
  );

  const forSale = listings.filter((l) => l.listingType === 'Sale').length;
  const forRent = listings.filter((l) => l.listingType === 'Rent').length;
  const parcels = listings.filter((l) => l.propertyType === 'Land').length;

  return (
    <>
      <Hero count={listings.length} />

      <FeaturedRail listings={featured} />

      {/* The three browsing routes, given equal weight. Buying, renting and
          buying land are different intents, not one default and two
          afterthoughts. */}
      <motion.section
        {...routeReveal}
        variants={staggerChildren(0.09)}
        className="mx-auto max-w-[82rem] px-5 pt-16 sm:px-8 sm:pt-20"
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <RouteCard
            href="/buy"
            label="Buy"
            count={forSale}
            noun={forSale === 1 ? 'property for sale' : 'properties for sale'}
            blurb="Houses, townhouses and apartments to live in, plus commercial and warehouse space. San Fernando, La Romaine, Palmiste, Couva and beyond."
          />
          <RouteCard
            href="/rent"
            label="Rent"
            count={forRent}
            noun={forRent === 1 ? 'property to rent' : 'properties to rent'}
            blurb="Apartments, townhouses and family homes, furnished and unfurnished, from studios to executive rentals."
          />
          <RouteCard
            href="/land"
            label="Land"
            count={parcels}
            noun={parcels === 1 ? 'parcel on the books' : 'parcels on the books'}
            blurb="Residential lots, agricultural acreage and investment land across South and Central Trinidad."
          />
        </div>
      </motion.section>

      <CalculatorTeaser />

      <motion.section
        {...agentsReveal}
        variants={revealUp}
        className="mx-auto max-w-[82rem] px-5 pt-16 sm:px-8 sm:pt-20"
      >
        {agents.length === 1 ? (
          <>
            <SectionHeading
              title="Your agent, start to finish"
              intro="One agent handles every listing here personally, from the first viewing to handing over the keys."
            />
            <div className="mt-8">
              <AgentFeature agent={agents[0]} listings={listings} headingLevel="h3" />
            </div>
          </>
        ) : (
          <>
            <SectionHeading
              title="The people who hold the files"
              intro="Every listing belongs to a named agent who has walked the property. Find the one who works your area."
              action={{ href: '/our-agents', label: 'All agents' }}
            />
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 xs:grid-cols-2 lg:grid-cols-4">
              {agents.slice(0, 4).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </>
        )}
      </motion.section>

      <QuickAnswers
        title="Common questions"
        id="home-answers"
        items={generalFaq(listings).filter((q) =>
          [
            'What areas does V-Star Properties cover?',
            'How many properties does V-Star Properties have for sale and rent?',
            'Do first-time buyers pay stamp duty in Trinidad?',
            'How do I sell or rent out my property with V-Star?',
          ].includes(q.q),
        )}
      />
      <div className="mx-auto -mt-6 max-w-[82rem] px-5 sm:px-8">
        <Link
          href="/faq"
          className="inline-flex min-h-11 items-center gap-2 text-[0.92rem] font-bold text-brand-deep underline decoration-brand/40 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-brand-deep"
        >
          All questions and answers
        </Link>
      </div>

      {/* Closing band. The one place on the page asking for the call. */}
      <motion.section
        {...closingReveal}
        variants={revealUp}
        className="mt-20 border-y border-mist-edge bg-mist-deep/50"
      >
        <div className="mx-auto flex max-w-[82rem] flex-col gap-6 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[38rem]">
            <h2 className="font-display text-[1.8rem] leading-tight tracking-display text-ink sm:text-[2.2rem]">
              Thinking of selling or renting out your property?
            </h2>
            <p className="mt-3 text-[0.98rem] leading-[1.7] text-ink-mute">
              V-Star lists, markets and closes sales and rentals across South
              and Central Trinidad, with individual attention from the first
              call. Tell us about the property and we will come back to you.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/sell"
              className="rounded-sm bg-brand-deep px-5 py-3 text-[0.9rem] font-bold text-mist transition-[background-color,transform] duration-200 ease-out hover:bg-ink active:translate-y-px"
            >
              List your property
            </Link>
            <Link
              href="/sell#manage"
              className="rounded-sm border border-ink/15 px-5 py-3 text-[0.9rem] text-ink transition-[background-color,border-color,transform] duration-200 ease-out hover:border-ink/30 hover:bg-mist active:translate-y-px"
            >
              Letting &amp; management
            </Link>
          </div>
        </div>
      </motion.section>
    </>
  );
}

/**
 * A doorway to a browsing route. Not a card grid item — there are exactly
 * three of these and they carry a live count, so they are closer to a
 * signpost.
 */
function RouteCard({
  href,
  label,
  count,
  noun,
  blurb,
}: {
  href: string;
  label: string;
  count: number;
  noun: string;
  blurb: string;
}) {
  return (
    <motion.div variants={revealUp}>
      <Link
        href={href}
        className="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-mist-edge bg-mist p-6 shadow-raise transition-[border-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lift active:translate-y-0 sm:p-7"
      >
        {/* A quiet wash that slides in on hover — the same signal a printed
            agency folder gives when you lift its cover, kept to the surface
            so it never competes with the arrow or the live count. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/[0.05] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[1.6rem] tracking-display text-ink sm:text-[1.9rem]">
              {label}
            </h2>
            <span
              aria-hidden
              className="text-accent-deep transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              <svg width="20" height="14" viewBox="0 0 20 14">
                <path
                  d="M1 7h17M12.5 1.5L18.5 7l-6 5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </span>
          </div>
          <p className="mt-2.5 max-w-[26rem] text-[0.92rem] leading-relaxed text-ink-mute">
            {blurb}
          </p>
        </div>
        <p className="tnum mt-6 border-t border-mist-edge pt-3.5 text-[0.82rem] text-ink-faint">
          {count} {noun}
        </p>
      </Link>
    </motion.div>
  );
}
