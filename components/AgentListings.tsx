'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useMemo, useState } from 'react';
import type { Listing } from '@/types/listing';
import { useListingsStore } from '@/lib/store';
import ListingCard from './ListingCard';

/**
 * Every listing the agent holds, on the profile itself.
 *
 * V-Star is a one-agent brokerage, so "this agent's listings" is the whole
 * catalogue. The client asked for it to be right there when someone opens
 * her profile, without a second click into Buy or Rent. Tabs split it the
 * way a caller asks ("what have you got to rent?"), a sort sits beside them,
 * and the grid pages in twelve at a time so 140 photos never load at once.
 */

type Tab = 'all' | 'sale' | 'rent' | 'land' | 'commercial';
type Sort = 'newest' | 'price-asc' | 'price-desc';

const TABS: { id: Tab; label: string; test: (l: Listing) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  {
    id: 'sale',
    label: 'Homes for sale',
    test: (l) => l.listingType === 'Sale' && l.propertyType !== 'Land' && l.propertyType !== 'Commercial',
  },
  { id: 'rent', label: 'For rent', test: (l) => l.listingType === 'Rent' },
  { id: 'land', label: 'Land', test: (l) => l.propertyType === 'Land' },
  { id: 'commercial', label: 'Commercial', test: (l) => l.propertyType === 'Commercial' },
];

const PAGE = 12;

export default function AgentListings({ agentName }: { agentName: string }) {
  const listings = useListingsStore((s) => s.listings);
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [shown, setShown] = useState(PAGE);

  const active = useMemo(() => listings.filter((l) => l.status !== 'Sold'), [listings]);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, active.filter(t.test).length])) as Record<Tab, number>,
    [active],
  );
  const tabs = TABS.filter((t) => t.id === 'all' || counts[t.id] > 0);

  const results = useMemo(() => {
    const test = TABS.find((t) => t.id === tab)!.test;
    const list = active.filter(test);
    // "Price on request" (0) sorts last either way rather than looking cheapest.
    const priced = (l: Listing, dir: 1 | -1) => (l.price > 0 ? l.price * dir : Infinity);
    if (sort === 'price-asc') return [...list].sort((a, b) => priced(a, 1) - priced(b, 1));
    if (sort === 'price-desc') return [...list].sort((a, b) => priced(a, -1) - priced(b, -1));
    return [...list].sort((a, b) => b.dateListed.localeCompare(a.dateListed));
  }, [active, tab, sort]);

  const visible = results.slice(0, shown);
  const remaining = results.length - visible.length;

  function choose(next: Tab) {
    setTab(next);
    setShown(PAGE);
  }

  return (
    <section id="listings" aria-labelledby="agent-listings-title" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <h2 id="agent-listings-title" className="font-display text-[1.7rem] leading-tight tracking-display text-ink sm:text-[2rem]">
            Every listing with {agentName}
          </h2>
          <p className="tnum mt-1.5 text-[0.95rem] text-ink-mute" role="status">
            {results.length} {results.length === 1 ? 'property' : 'properties'}
            {tab === 'all' ? ' on the books right now' : ''}
          </p>
        </div>

        <label className="flex items-center gap-2 text-[0.82rem] text-ink-mute">
          <span className="sr-only xs:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-11 rounded-sm border border-mist-edge bg-mist px-3 text-[16px] text-ink transition-colors duration-200 ease-out hover:border-ink/25 focus:border-brand desk:min-h-0 desk:py-2 desk:text-[0.85rem]"
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
      </div>

      {/* Tabs as a scroll rail on phones, a wrapped row from sm up. */}
      <div
        role="tablist"
        aria-label="Filter listings"
        className="hide-scrollbar -mx-5 mt-6 flex gap-1.5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {tabs.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="agent-listings-grid"
              onClick={() => choose(t.id)}
              className={
                'relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.88rem] transition-[background-color,border-color,color,transform] duration-200 ease-out active:scale-[0.97] desk:min-h-0 desk:py-2 ' +
                (on
                  ? 'border-brand-deep bg-brand-deep text-mist'
                  : 'border-mist-edge bg-mist text-ink-soft hover:border-brand/60 hover:text-ink')
              }
            >
              {t.label}
              <span
                className={
                  'tnum rounded-full px-1.5 text-[0.75rem] ' +
                  (on ? 'bg-ink/35 text-mist' : 'bg-mist-deep text-ink-mute')
                }
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        id="agent-listings-grid"
        role="tabpanel"
        layout={!reduce}
        className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((listing, i) => (
            <ListingCard key={listing.id} listing={listing} priority={i < 3} />
          ))}
        </AnimatePresence>
      </motion.div>

      {results.length === 0 && (
        <p className="mt-10 rounded-sm border border-mist-edge bg-mist-deep px-5 py-6 text-[0.95rem] text-ink-mute">
          Nothing in this category right now. Call or WhatsApp {agentName} and ask what is coming up.
        </p>
      )}

      {remaining > 0 && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="tnum inline-flex min-h-12 items-center gap-2 rounded-sm border border-brand-deep px-6 text-[0.92rem] text-brand-deep transition-[background-color,color,transform] duration-200 ease-out hover:bg-brand-deep hover:text-mist active:translate-y-px"
          >
            Show {Math.min(PAGE, remaining)} more
            <span className="text-[0.82rem] opacity-70">({remaining} left)</span>
          </button>
        </div>
      )}
    </section>
  );
}
