import Image from 'next/image';
import Link from 'next/link';
import type { Agent } from '@/types/agent';
import type { Listing } from '@/types/listing';
import { BRAND } from './Logo';

/**
 * The one-agent brokerage's profile card: logo or portrait, the brand line,
 * a live ledger of what is on the books, and one action that opens the
 * profile with every listing on it. Used on /our-agents and the homepage.
 */
export default function AgentFeature({
  agent,
  listings,
  headingLevel = 'h2',
}: {
  agent: Agent;
  listings: Listing[];
  headingLevel?: 'h2' | 'h3';
}) {
  const forSale = listings.filter((l) => l.listingType === 'Sale').length;
  const forRent = listings.filter((l) => l.listingType === 'Rent').length;
  const Heading = headingLevel;

  return (
    <Link
      href={'/our-agents/' + agent.slug}
      className="group grid overflow-hidden rounded-sm border border-mist-edge bg-mist shadow-raise transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lift active:translate-y-0 md:grid-cols-[minmax(16rem,22rem)_1fr]"
    >
      <div className="relative aspect-square bg-mist md:aspect-auto md:min-h-[22rem] md:border-r md:border-mist-edge">
        <Image
          src={agent.image}
          alt={agent.name + (agent.imageIsLogo ? ' logo' : ', ' + agent.role)}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 22rem"
          className={agent.imageIsLogo ? 'object-contain p-4' : 'object-cover [object-position:50%_18%]'}
        />
      </div>

      <div className="flex min-w-0 flex-col p-6 sm:p-9">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brand-deep">
          {agent.role}
        </p>
        <Heading className="mt-2 font-display text-[2rem] leading-tight tracking-display text-ink sm:text-[2.4rem]">
          {agent.name}
        </Heading>
        <p className="mt-2 font-serif text-[1.08rem] italic leading-snug text-brand-deep">
          &ldquo;{BRAND.tagline}&rdquo;
        </p>
        <p className="mt-5 max-w-[60ch] text-[0.98rem] leading-[1.7] text-ink-mute">
          {agent.bio}
        </p>

        <dl className="ledger mt-7 max-w-[30rem]">
          <div className="flex-1 py-3">
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint sm:text-[0.6rem]">
              For sale
            </dt>
            <dd className="tnum mt-0.5 font-display text-[1.3rem] text-ink">{forSale}</dd>
          </div>
          <div className="flex-1 py-3 pl-3">
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint sm:text-[0.6rem]">
              For rent
            </dt>
            <dd className="tnum mt-0.5 font-display text-[1.3rem] text-ink">{forRent}</dd>
          </div>
          <div className="flex-1 py-3 pl-3">
            <dt className="text-[0.68rem] uppercase tracking-[0.14em] text-ink-faint sm:text-[0.6rem]">
              Experience
            </dt>
            <dd className="tnum mt-0.5 font-display text-[1.3rem] text-ink">
              {agent.experienceLabel ?? new Date().getFullYear() - agent.joined + ' yrs'}
            </dd>
          </div>
        </dl>

        <span className="mt-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-sm bg-brand-deep px-5 text-[0.92rem] font-bold text-mist transition-colors duration-200 ease-out group-hover:bg-ink">
          View profile and all {listings.length} listings
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-0.5">
            <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
