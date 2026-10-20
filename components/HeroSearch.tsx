'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useId, useMemo, useState } from 'react';
import { useListings } from '@/lib/listings-context';
import { PROPERTY_TYPES } from '@/types/listing';
import type { ListingType, SaleOrRent } from '@/types/listing';
import { PRICE_BOUNDS, REGIONS } from '@/lib/filters';

/**
 * The hero search, set as the agency's printed search sheet.
 *
 * The old field was a single free-text box: it asked a visitor to know the
 * name of the place they wanted before the site would help them. Every
 * property site worth copying lets you *pick* instead of type, because the
 * dropdown is also the inventory — opening it is how you learn the agency
 * covers Tobago.
 *
 * The panel is one ruled row of labelled cells divided by hairlines, which is
 * the spec-ledger device the rest of the site is built on (beds/baths/sqft on
 * ListingCard, territory/years on AgentCard, the settlement statement). The
 * search reads as the same instrument, not as a widget bolted onto the photo.
 *
 * Free text survives as the first cell, so nothing the old field could do is
 * lost — but it is now one of three ways in rather than the only one.
 */

/** Budget ceilings, in TTD. Sale figures and rent figures are separate scales. */
const SALE_CAPS = [1_000_000, 2_000_000, 3_500_000, 5_000_000] as const;
const RENT_CAPS = [5_000, 8_000, 12_000, 20_000] as const;

/** A short label for a cap, e.g. 3_500_000 -> "$3.5M". */
function capLabel(value: number, mode: 'buy' | 'rent'): string {
  if (mode === 'rent') return '$' + (value / 1000).toFixed(0) + 'k';
  const m = value / 1_000_000;
  return '$' + (Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)) + 'M';
}

/**
 * The property types offered as one-tap shortcuts, with the route each opens.
 *
 * Land is here and is a *route*, not a filter, because a parcel carries no
 * beds, baths or floor area and has its own duty schedule — the same split the
 * rest of the site enforces. Commercial is a sector rather than a type, so it
 * hands `use=commercial` to the browsing route.
 */
const QUICK: {
  key: string;
  label: string;
  /** Overrides the Buy/Rent route when the type owns its own page. */
  href?: string;
  type?: ListingType;
  sector?: 'commercial';
  path: string;
}[] = [
  { key: 'House', label: 'Houses', type: 'House', path: 'M3 9.2 10 3.6l7 5.6V17H3z M7.6 17v-4.6h4.8V17' },
  {
    key: 'Apartment',
    label: 'Apartments',
    type: 'Apartment',
    path: 'M4 3.4h8.6V17H4z M14.6 8.2H17V17h-2.4 M6.6 6.4h1.4 M9.4 6.4h1.4 M6.6 9.4h1.4 M9.4 9.4h1.4 M6.6 12.4h1.4 M9.4 12.4h1.4',
  },
  {
    key: 'Townhouse',
    label: 'Townhouses',
    type: 'Townhouse',
    path: 'M2.6 17V8.4L7 5l4.4 3.4V17 M11.4 17V9.6L15 7l2.4 1.8V17 M5.4 17v-3.4h3.2V17',
  },
  { key: 'Land', label: 'Land', href: '/land', path: 'M2.6 14.4 7 6.6l3.2 5 2.2-3 4.6 5.8z M2.6 17h14.8' },
  {
    key: 'Commercial',
    label: 'Commercial',
    sector: 'commercial',
    path: 'M2.8 17V6.8l6-3.2v13.4 M8.8 17V8.4l7 2.6V17 M2.8 17h14 M5 9.6v1.6 M5 13v1.6 M11.6 12.6v1.6',
  },
];

export default function HeroSearch({ count }: { count: number }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const uid = useId();

  const [mode, setMode] = useState<'buy' | 'rent'>('buy');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState<ListingType | ''>('');
  const [cap, setCap] = useState<number | ''>('');
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);

  const listings = useListings();
  const sector: SaleOrRent = mode === 'buy' ? 'Sale' : 'Rent';

  /**
   * The options are read off the catalogue, not hardcoded.
   *
   * Offering a choice that returns nothing is worse than offering no choice at
   * all — the visitor blames the agency, not the filter. Apartments and
   * commercial space are rent-only in this catalogue, so they must disappear
   * from the Buy panel rather than lead to an empty grid.
   *
   * Land is excluded here throughout: it has its own route, for the same
   * reason it is absent from /buy and /rent.
   */
  const stock = useMemo(
    () =>
      listings.filter(
        (l) => l.listingType === sector && l.propertyType !== 'Land',
      ),
    [listings, sector],
  );

  /**
   * Regions are listed against RESIDENTIAL stock only.
   *
   * The browsing route opens in the residential sector, so a region whose only
   * listing is a commercial unit — South Trinidad's warehouse, in this
   * catalogue — would land on an empty grid. Commercial space is reached
   * through its own shortcut, which sets the sector as well as the region.
   */
  /**
   * Budget ceilings that actually cut the catalogue.
   *
   * A hardcoded ladder drifts from the stock the moment prices move: "Up to
   * $1M" listed four options above the cheapest house on the books and
   * returned nothing. Only rungs that at least one listing sits under are
   * offered, and the top rung is dropped because "up to the most expensive
   * property we have" is the same as no maximum.
   */
  const caps = useMemo(() => {
    const ladder = mode === 'buy' ? SALE_CAPS : RENT_CAPS;
    const prices = stock.map((l) => l.price);
    if (!prices.length) return [];
    const cheapest = Math.min(...prices);
    const dearest = Math.max(...prices);
    return ladder.filter((c) => c > cheapest && c < dearest);
  }, [stock, mode]);

  /**
   * How high the bed and bath steppers may go.
   *
   * Capped at what the catalogue can actually satisfy, for the same reason the
   * price rungs are: "5+ beds" on a catalogue whose largest house has four is
   * a guaranteed empty grid. Land and the commercial unit carry null beds, so
   * they are skipped rather than counted as zero.
   *
   * Baths are stored fractional (3.5 = three full plus a powder room), but a
   * searcher thinks in whole rooms, so the ceiling floors to an integer.
   */
  const bedMax = useMemo(
    () => Math.min(5, Math.max(0, ...stock.map((l) => l.beds ?? 0))),
    [stock],
  );
  const bathMax = useMemo(
    () => Math.min(4, Math.floor(Math.max(0, ...stock.map((l) => l.baths ?? 0)))),
    [stock],
  );

  const regionsWithStock = useMemo(
    () =>
      REGIONS.filter((r) =>
        stock.some((l) => l.region === r && l.propertyType !== 'Commercial'),
      ),
    [stock],
  );

  const typesWithStock = useMemo(
    () =>
      PROPERTY_TYPES.filter(
        (t) => t !== 'Land' && stock.some((l) => l.propertyType === t),
      ),
    [stock],
  );

  /** How many of the current mode's listings a shortcut would actually open. */
  const quickCount = (q: (typeof QUICK)[number]) => {
    if (q.key === 'Land') {
      return listings.filter((l) => l.propertyType === 'Land').length;
    }
    if (q.sector) return stock.filter((l) => l.propertyType === 'Commercial').length;
    return stock.filter((l) => l.propertyType === q.type).length;
  };

  // Only shortcuts that lead somewhere. Land is always offered when parcels
  // exist, because it is a route of its own and does not depend on Buy/Rent.
  const quick = QUICK.filter((q) => quickCount(q) > 0);

  // A region or type chosen under Buy may not exist under Rent. Rather than
  // silently returning nothing, the cell falls back to "any".
  const safeRegion = regionsWithStock.includes(region as (typeof REGIONS)[number])
    ? region
    : '';
  const safeType = typesWithStock.includes(type as ListingType) ? type : '';
  // Switching Buy/Rent can lower the ceiling under a chosen minimum; clamp
  // rather than carry a value that now returns nothing.
  const safeBeds = Math.min(beds, bedMax);
  const safeBaths = Math.min(baths, bathMax);

  /**
   * Search is a doorway, not a filter: it hands every choice to the browsing
   * route that owns the results, as query params that route seeds its state
   * from once. Only cells the visitor actually set are sent, so an untouched
   * panel opens the plain catalogue rather than a pre-narrowed one.
   */
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    if (safeRegion) params.set('region', safeRegion);
    if (safeType) params.set('type', safeType);
    if (cap !== '') params.set('max', String(cap));
    if (safeBeds > 0) params.set('beds', String(safeBeds));
    if (safeBaths > 0) params.set('baths', String(safeBaths));
    const qs = params.toString();
    router.push('/' + mode + (qs ? '?' + qs : ''));
  };

  /**
   * Switching Buy/Rent has to drop the budget: $3.5M is a sale ceiling and
   * would silently exclude every rental on the books. The other two cells mean
   * the same thing in both modes and are kept.
   */
  const switchMode = (next: 'buy' | 'rent') => {
    setMode(next);
    setCap('');
    setBeds(0);
    setBaths(0);
  };

  // A shortcut is a complete search on its own — it carries whatever is
  // already in the panel so a chosen area is not thrown away by tapping
  // "Houses".
  const quickHref = (q: (typeof QUICK)[number]) => {
    if (q.href) return q.href;
    const params = new URLSearchParams();
    if (safeRegion) params.set('region', safeRegion);
    if (q.type) params.set('type', q.type);
    if (q.sector) params.set('use', q.sector);
    const qs = params.toString();
    return '/' + mode + (qs ? '?' + qs : '');
  };

  const rise = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
    : {
        initial: { opacity: 0.35, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <motion.form {...rise} onSubmit={submit} className="mt-9 max-w-[54rem]">
      {/* Buy / Rent decides which route opens, so it sits with the panel
          rather than in the results below. It rides on the panel's top edge
          like the tab on a file, which is also why it is not full-width. */}
      <div
        className="inline-flex rounded-t-sm border border-b-0 border-mist/20 bg-ink/45 p-0.5 backdrop-blur-md"
        role="group"
        aria-label="Buy or rent"
      >
        {(['buy', 'rent'] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              aria-pressed={active}
              className="relative min-h-11 px-7 text-[0.85rem] tracking-wide transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand desk:min-h-0 sm:py-2"
            >
              {active && (
                <motion.span
                  layoutId="hero-mode"
                  aria-hidden
                  transition={
                    reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }
                  }
                  className="absolute inset-0 rounded-[2px] bg-mist"
                />
              )}
              <span className={'relative ' + (active ? 'text-ink' : 'text-mist/70')}>
                {m === 'buy' ? 'Buy' : 'Rent'}
              </span>
            </button>
          );
        })}
      </div>

      {/* The sheet. Cells stack on a phone and rule up into a row from sm,
          where the hairlines between them do the work a border would. */}
      <div className="rounded-sm rounded-tl-none border border-mist/20 bg-ink/70 backdrop-blur-md transition-colors duration-300 ease-out focus-within:border-accent/70">
        <div className="flex flex-col divide-y divide-mist/15 sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
          <Cell label="Where" className="sm:flex-[1.3]">
            <select
              id={uid + '-region'}
              aria-label="Where"
              value={safeRegion}
              onChange={(e) => setRegion(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-sm bg-transparent pl-4 pr-10 pt-[1.9rem] text-[16px] text-mist outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pt-[1.85rem] desk:text-[0.95rem]"
            >
              <option value="">Anywhere in T&amp;T</option>
              {regionsWithStock.map((r) => (
                <option key={r} value={r} className="bg-ink text-mist">
                  {r}
                </option>
              ))}
            </select>
            <Caret />
          </Cell>

          <Cell label="What" className="sm:flex-[1]">
            <select
              id={uid + '-type'}
              aria-label="Property type"
              value={safeType}
              onChange={(e) => setType(e.target.value as ListingType | '')}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-sm bg-transparent pl-4 pr-10 pt-[1.9rem] text-[16px] text-mist outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pt-[1.85rem] desk:text-[0.95rem]"
            >
              <option value="">Any property</option>
              {typesWithStock.map((t) => (
                <option key={t} value={t} className="bg-ink text-mist">
                  {t}
                </option>
              ))}
            </select>
            <Caret />
          </Cell>

          <Cell
            label={mode === 'buy' ? 'Budget' : 'Budget / month'}
            className={caps.length ? 'sm:flex-[0.95]' : 'hidden'}
          >
            <select
              id={uid + '-cap'}
              aria-label="Budget"
              value={cap}
              onChange={(e) => setCap(e.target.value === '' ? '' : Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-sm bg-transparent pl-4 pr-10 pt-[1.9rem] text-[16px] text-mist outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:pt-[1.85rem] desk:text-[0.95rem]"
            >
              <option value="">No maximum</option>
              {caps.map((c) => (
                <option key={c} value={c} className="bg-ink text-mist">
                  Up to {capLabel(c, mode)}
                </option>
              ))}
            </select>
            <Caret />
          </Cell>

          {/* Beds and baths share one cell. They are the only two choices here
              that are a small count rather than a list, so they get steppers
              instead of a fourth and fifth dropdown — one extra decision, not
              two, and the row stays four cells wide. Hidden entirely when the
              current stock has no bedrooms to speak of, which is the case for
              a commercial-only catalogue. */}
          <Cell
            label="Beds / baths"
            as="div"
            className={bedMax > 0 || bathMax > 0 ? 'sm:flex-none' : 'hidden'}
          >
            {/* Two steppers need ~290px side by side, which a 320px screen
                cannot give once the cell's own gutters are taken out — the
                bathrooms "+" used to land 27px past the right edge. They wrap
                to their own lines there and sit in a row again from xs up,
                where there is room. */}
            <div className="flex flex-col gap-1 pt-0.5 xs:flex-row xs:items-center">
              <Stepper
                label="bedrooms"
                short="bd"
                value={safeBeds}
                max={bedMax}
                onChange={setBeds}
              />
              <span
                aria-hidden
                className="hidden h-5 w-px shrink-0 bg-mist/15 xs:block"
              />
              <Stepper
                label="bathrooms"
                short="ba"
                value={safeBaths}
                max={bathMax}
                onChange={setBaths}
              />
            </div>
          </Cell>
        </div>

        {/* Free text is the escape hatch under the four cells: a visitor who
            knows "Maraval" by name should not have to find it in a list. */}
        <div className="flex items-center gap-2 border-t border-mist/15">
          <MagnifierIcon />
          <label htmlFor={uid + '-q'} className="sr-only">
            Search by area, street or keyword
          </label>
          <input
            id={uid + '-q'}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or search by name: Palmiste, Gulf View&hellip;"
            className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-mist outline-none placeholder:text-mist/60 sm:py-4 desk:text-[0.95rem]"
          />
          <button
            type="submit"
            // px-6 plus the magnifier and gaps left no room for the input at
            // 320px — the label clipped to "Sea". Narrower padding below xs.
            className="m-1.5 flex min-h-12 shrink-0 items-center gap-2 rounded-[2px] bg-accent px-3.5 text-[0.85rem] tracking-wide text-ink transition-[background-color,transform] duration-200 ease-out hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mist active:translate-y-px xs:px-6"
          >
            Search
          </button>
        </div>
      </div>

      {/* One tap to the thing most visitors came for. These are links, not
          buttons: a shortcut is a destination, so it can be opened in a new
          tab and read by a crawler as a route into the catalogue. */}
      <div className="hide-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {quick.map((q) => (
          <Link
            key={q.key}
            href={quickHref(q)}
            className="group inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-sm border border-mist/15 bg-ink/35 px-3.5 text-[0.8rem] text-mist/75 backdrop-blur-md transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-accent/60 hover:bg-ink/55 hover:text-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px desk:min-h-0 sm:py-2"
          >
            <svg
              aria-hidden
              width="19"
              height="19"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-accent transition-colors duration-200 ease-out"
            >
              <path d={q.path} />
            </svg>
            {q.label}
            <span className="tnum text-mist/60 transition-colors duration-200 ease-out group-hover:text-accent">
              {quickCount(q)}
            </span>
          </Link>
        ))}
      </div>

      <p className="tnum mt-4 text-[0.8rem] text-mist/65">
        {count} listings on the books today ·{' '}
        <Link
          href="/mortgages"
          className="inline-flex min-h-11 items-center underline decoration-mist/25 underline-offset-4 transition-colors duration-300 ease-out hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand desk:min-h-0"
        >
          work out a mortgage
        </Link>
      </p>
    </motion.form>
  );
}

/**
 * One labelled cell of the sheet.
 *
 * The label is always visible rather than a placeholder, because a placeholder
 * disappears the moment it is answered — and the row of standing labels is
 * what makes the panel read as the ledger rather than as three dropdowns.
 */
function Cell({
  label,
  className = '',
  as,
  children,
}: {
  label: string;
  className?: string;
  /** "div" for a cell holding several controls rather than one select. */
  as?: 'div';
  children: React.ReactNode;
}) {
  return (
    <div
      role={as === 'div' ? 'group' : undefined}
      aria-label={as === 'div' ? label : undefined}
      className={
        'group relative flex min-h-[4.25rem] min-w-0 flex-col justify-center gap-1 px-4 py-3 transition-colors duration-200 ease-out focus-within:bg-mist/[0.06] hover:bg-mist/[0.04] sm:min-h-[4.5rem] sm:py-3.5 ' +
        className
      }
    >
      {/* Larger on mobile, per the house ledger-label pattern. */}
      <span className="pointer-events-none text-[0.68rem] uppercase tracking-[0.16em] text-accent sm:text-[0.6rem]">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * A minimum-count control: "Any", then 1+ up to what the catalogue holds.
 *
 * Two buttons and a figure rather than a dropdown, because the range is three
 * to five values and a searcher raises or lowers it by one — a select would
 * cost a tap to open, a scan and a tap to choose. Minus is disabled at Any and
 * plus at the ceiling, so no press can produce an empty grid.
 *
 * The value reads "Any" / "1+ bd" — the plus matters, since these filter as
 * minimums, and a bare "3" would promise exactly three bedrooms.
 */
function Stepper({
  label,
  short,
  value,
  max,
  onChange,
}: {
  label: string;
  short: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(0, value + delta)));

  return (
    <span className="inline-flex items-center gap-1">
      <StepButton
        label={'Fewer ' + label}
        disabled={value <= 0}
        onClick={() => step(-1)}
      >
        <path d="M3.5 7h7" />
      </StepButton>

      {/* Fixed width so the row does not shuffle as the figure changes. */}
      <span
        aria-live="polite"
        className="tnum w-[3.4rem] text-center text-[0.9rem] sm:text-[0.86rem]"
      >
        {value === 0 ? (
          <>
            <span className="text-mist/70">Any</span>{' '}
            <span className="text-mist/60">{short}</span>
          </>
        ) : (
          <span className="text-mist">{value + '+ ' + short}</span>
        )}
      </span>

      <StepButton
        label={'More ' + label}
        disabled={value >= max}
        onClick={() => step(1)}
      >
        <path d="M7 3.5v7M3.5 7h7" />
      </StepButton>
    </span>
  );
}

/** One round +/- control. 44px of tap area on touch, tighter from sm. */
function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-[2px] text-mist/70 transition-[color,background-color,transform] duration-200 ease-out hover:bg-mist/10 hover:text-mist focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand active:translate-y-px disabled:pointer-events-none disabled:text-mist/20 desk:h-7 desk:w-6"
    >
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {children}
      </svg>
    </button>
  );
}

/** The dropdown caret. Sits over the native select, which is appearance-none. */
function Caret() {
  return (
    <svg
      aria-hidden
      width="11"
      height="7"
      viewBox="0 0 11 7"
      fill="none"
      className="pointer-events-none absolute bottom-[1.15rem] right-4 text-mist/45 sm:bottom-[1.3rem]"
    >
      <path
        d="M1 1.2 5.5 5.6 10 1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MagnifierIcon() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" className="ml-3 shrink-0 text-mist/45">
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M12 12l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
