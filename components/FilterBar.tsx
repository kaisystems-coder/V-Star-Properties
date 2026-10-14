'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useEffect, useState } from 'react';
import type { Listing, ListingType, SaleOrRent, Sector } from '@/types/listing';
import { typesForSector } from '@/types/listing';
import {
  activeFilterCount,
  allAmenities,
  allRegions,
  defaultFilters,
  type Filters,
  type SortKey,
} from '@/lib/filters';
import PriceRange from './PriceRange';

const SECTORS: { value: Sector; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

const BED_STEPS = [0, 1, 2, 3, 4, 5];
const BATH_STEPS = [0, 1, 2, 3, 4];

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'beds', label: 'Most bedrooms' },
];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        // min-h-11 (44px) on touch; the tighter desktop size returns at sm.
        'min-h-11 rounded-sm border px-3.5 py-2.5 text-[0.82rem] transition-[background-color,border-color,color,transform] duration-200 ease-out active:translate-y-px desk:min-h-0 sm:px-3 sm:py-1.5 sm:text-[0.78rem] ' +
        (active
          ? 'border-accent-deep bg-accent-wash text-ink'
          : 'border-mist-edge bg-mist text-ink-mute hover:border-ink/25 hover:text-ink')
      }
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint">
      {children}
    </span>
  );
}

/** The full control set, shared by the desktop rail and the mobile sheet. */
function Controls({
  filters,
  setFilters,
  listings,
  showSort = false,
}: {
  filters: Filters;
  setFilters: (next: Filters) => void;
  listings: Listing[];
  /** The sticky bar hides its sort control below sm, so the sheet shows one. */
  showSort?: boolean;
}) {
  const regions = allRegions(listings);
  const amenities = allAmenities(listings);
  const patch = (part: Partial<Filters>) => setFilters({ ...filters, ...part });

  // Only the types belonging to the chosen sector are offered. Land is absent
  // from both: it has its own route, because it carries no floor area, no
  // bedrooms and its own stamp duty schedule.
  const visibleTypes = typesForSector(filters.sector);

  /**
   * Switching sector drops anything the new sector cannot show.
   *
   * A type that no longer belongs would silently return nothing, and a bed or
   * bath count would keep filtering after its control has left the screen —
   * both are narrowings with no visible cause, which is the worst kind.
   */
  const setSector = (sector: Sector) =>
    patch({
      sector,
      propertyTypes: filters.propertyTypes.filter((t) =>
        typesForSector(sector).includes(t),
      ),
      ...(sector === 'residential' ? {} : { beds: 0, baths: 0 }),
    });

  const togglePropertyType = (type: ListingType) =>
    patch({
      propertyTypes: filters.propertyTypes.includes(type)
        ? filters.propertyTypes.filter((t) => t !== type)
        : [...filters.propertyTypes, type],
    });

  const toggleAmenity = (amenity: string) =>
    patch({
      amenities: filters.amenities.includes(amenity)
        ? filters.amenities.filter((a) => a !== amenity)
        : [...filters.amenities, amenity],
    });

  return (
    <div className="flex flex-col gap-7">
      {showSort && (
        <div className="flex flex-col gap-2 sm:hidden">
          <label htmlFor="sheet-sort">
            <FieldLabel>Sort by</FieldLabel>
          </label>
          <select
            id="sheet-sort"
            value={filters.sort}
            onChange={(e) => patch({ sort: e.target.value as SortKey })}
            // 16px on touch or iOS Safari zooms the page when the select takes
            // focus; the rest of the site's controls already follow this.
            className="w-full rounded-sm border border-mist-edge bg-mist px-3 py-3 text-[16px] text-ink transition-colors duration-200 ease-out hover:border-ink/25 desk:text-[0.86rem]"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="filter-region">
          <FieldLabel>Location</FieldLabel>
        </label>
        <select
          id="filter-region"
          value={filters.region}
          onChange={(e) => patch({ region: e.target.value })}
          className="w-full rounded-sm border border-mist-edge bg-mist px-3 py-3 text-[16px] text-ink transition-colors duration-200 ease-out hover:border-ink/25 desk:py-2.5 desk:text-[0.86rem]"
        >
          <option value="">Anywhere in T&amp;T</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Sector scopes the property types below it. A buyer decides "somewhere
          to live" or "somewhere to trade from" before they decide between a
          townhouse and a villa, so it leads and narrows what follows. */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Use</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {SECTORS.map((option) => (
            <Chip
              key={option.value}
              active={filters.sector === option.value}
              onClick={() => setSector(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* With one type in the sector the chip row would restate the sector
          button directly above it, so it is only offered where it narrows. */}
      {visibleTypes.length > 1 && (
        <div className="flex flex-col gap-2">
          <FieldLabel>Property type</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {visibleTypes.map((type) => (
              <Chip
                key={type}
                active={filters.propertyTypes.includes(type)}
                onClick={() => togglePropertyType(type)}
              >
                {type}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <PriceRange
        listingType={filters.listingType}
        min={filters.priceMin}
        max={filters.priceMax}
        onChange={(next) => patch(next)}
      />

      {/* Bedrooms and bathrooms describe somewhere to live. On commercial
          stock they would filter against nulls and silently return nothing. */}
      {filters.sector === 'residential' && (
        <>
          <div className="flex flex-col gap-2">
            <FieldLabel>Bedrooms</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {BED_STEPS.map((n) => (
                <Chip
                  key={n}
                  active={filters.beds === n}
                  onClick={() => patch({ beds: n })}
                >
                  {n === 0 ? 'Any' : n === 5 ? '5+' : n}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel>Bathrooms</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {BATH_STEPS.map((n) => (
                <Chip
                  key={n}
                  active={filters.baths === n}
                  onClick={() => patch({ baths: n })}
                >
                  {n === 0 ? 'Any' : n === 4 ? '4+' : n}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel>Floor area, sq ft</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            id="filter-sqft-min"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            aria-label="Minimum square feet"
            value={filters.sqftMin ?? ''}
            onChange={(e) =>
              patch({ sqftMin: e.target.value === '' ? null : Number(e.target.value) })
            }
            className="tnum w-full rounded-sm border border-mist-edge bg-mist px-3 py-3 text-[16px] text-ink placeholder:text-ink-faint sm:py-2.5 desk:text-[0.86rem]"
          />
          <span aria-hidden className="text-ink-faint">
            &ndash;
          </span>
          <input
            id="filter-sqft-max"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            aria-label="Maximum square feet"
            value={filters.sqftMax ?? ''}
            onChange={(e) =>
              patch({ sqftMax: e.target.value === '' ? null : Number(e.target.value) })
            }
            className="tnum w-full rounded-sm border border-mist-edge bg-mist px-3 py-3 text-[16px] text-ink placeholder:text-ink-faint sm:py-2.5 desk:text-[0.86rem]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>Amenities</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {amenities.map((a) => (
            <Chip
              key={a}
              active={filters.amenities.includes(a)}
              onClick={() => toggleAmenity(a)}
            >
              {a}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FilterBar({
  mode,
  filters,
  setFilters,
  listings,
  resultCount,
}: {
  /** Fixed by the route: /buy is Sale, /rent is Rent. */
  mode: SaleOrRent;
  filters: Filters;
  setFilters: (next: Filters) => void;
  listings: Listing[];
  resultCount: number;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const reduce = useReducedMotion();
  const count = activeFilterCount(filters);

  // Lock the page behind the mobile sheet.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const clearAll = () => setFilters(defaultFilters(mode));

  return (
    <>
      <div className="sticky top-[4.5rem] z-sticky border-y border-mist-edge bg-mist/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[82rem] items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-8 sm:py-3">
          {/* Buy / Rent are separate routes, so this is navigation, not a
              filter. Rendering it as links keeps the URL and the results in
              agreement and lets the pair be opened in a new tab. */}
          <div className="relative flex shrink-0 rounded-sm border border-mist-edge p-0.5">
            {([
              { mode: 'Sale' as const, href: '/buy', label: 'Buy' },
              { mode: 'Rent' as const, href: '/rent', label: 'Rent' },
            ]).map((tab) => {
              const active = mode === tab.mode;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex min-h-11 items-center px-3.5 text-[0.82rem] tracking-wide transition-colors duration-200 ease-out desk:min-h-0 sm:px-4 sm:py-1.5 sm:text-[0.8rem]"
                >
                  {active && (
                    <motion.span
                      layoutId="mode-pill"
                      aria-hidden
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 420, damping: 34 }
                      }
                      className="absolute inset-0 rounded-[2px] bg-ink"
                    />
                  )}
                  <span className={'relative ' + (active ? 'text-mist' : 'text-ink-mute')}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <p className="tnum hidden shrink-0 text-[0.8rem] text-ink-mute sm:block">
            {resultCount} {resultCount === 1 ? 'property' : 'properties'}
          </p>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            {/* Sort sits in the bar from sm up. Below that the bar has room
                for one control only, so sorting moves into the sheet. */}
            <label htmlFor="sort" className="sr-only">
              Sort listings
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })}
              // Shown from sm up, which includes touch tablets — so the base
              // size has to clear 16px or iOS zooms, and only a real mouse
              // gets the tighter text.
              className="hidden min-h-11 rounded-sm border border-mist-edge bg-mist px-3 py-2 text-[16px] text-ink-soft transition-colors duration-200 ease-out hover:border-ink/25 sm:block desk:min-h-0 desk:text-[0.8rem]"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-sm border border-ink/15 px-4 text-[0.82rem] text-ink desk:min-h-0 sm:py-2 sm:text-[0.8rem] transition-[background-color,border-color,transform] duration-200 ease-out hover:bg-mist-deep active:translate-y-px lg:hidden"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path
                  d="M1 3h12M3 7h8M5.5 11h3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Filters
              {count > 0 && (
                <span className="tnum rounded-full bg-accent px-1.5 text-[0.68rem] text-ink">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: the same controls in a bottom sheet. */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSheetOpen(false)}
              className="fixed inset-0 z-overlay bg-ink/45 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              key="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Filter listings"
              initial={reduce ? { opacity: 0 } : { y: '100%' }}
              animate={reduce ? { opacity: 1 } : { y: 0 }}
              exit={reduce ? { opacity: 0 } : { y: '100%' }}
              transition={
                reduce
                  ? { duration: 0.15 }
                  : { type: 'spring', stiffness: 320, damping: 36 }
              }
              className="fixed inset-x-0 bottom-0 z-modal flex max-h-[86dvh] flex-col rounded-t-xl border-t border-mist-edge bg-mist shadow-float lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-mist-edge px-5 py-4">
                <h2 className="font-display text-[1.15rem] tracking-display text-ink">
                  Refine
                </h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-mute transition-colors duration-200 ease-out hover:bg-mist-deep hover:text-ink sm:h-auto sm:w-auto sm:p-1.5"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                    <path
                      d="M4 4l10 10M14 4L4 14"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <Controls
                  filters={filters}
                  setFilters={setFilters}
                  listings={listings}
                  showSort
                />
              </div>

              <div className="flex items-center gap-3 border-t border-mist-edge px-5 py-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-sm border border-mist-edge px-4 py-3 text-[0.85rem] text-ink-mute transition-colors duration-200 ease-out hover:text-ink"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="tnum flex-1 rounded-sm bg-ink px-4 py-3 text-[0.85rem] text-mist transition-transform duration-200 ease-out active:translate-y-px"
                >
                  Show {resultCount} {resultCount === 1 ? 'property' : 'properties'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Desktop filters, in a sticky rail beside the grid. Same Controls as the
 * mobile sheet, so the two can never drift apart.
 */
export function FilterRail({
  filters,
  setFilters,
  listings,
  mode,
}: {
  filters: Filters;
  setFilters: (next: Filters) => void;
  listings: Listing[];
  mode: SaleOrRent;
}) {
  const count = activeFilterCount(filters);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[9.5rem] max-h-[calc(100vh-11rem)] overflow-y-auto pr-1">
        <div className="flex items-center justify-between pb-5">
          <h2 className="font-display text-[1.05rem] tracking-display text-ink">
            Refine
          </h2>
          {count > 0 && (
            <button
              type="button"
              onClick={() => setFilters(defaultFilters(mode))}
              className="text-[0.78rem] text-accent-deep underline decoration-accent/40 underline-offset-4 transition-colors duration-200 ease-out hover:text-ink"
            >
              Clear all
            </button>
          )}
        </div>
        <Controls filters={filters} setFilters={setFilters} listings={listings} />
      </div>
    </aside>
  );
}
