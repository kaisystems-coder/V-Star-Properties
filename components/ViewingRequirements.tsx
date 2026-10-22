import type { ViewingRequirement } from '@/lib/viewing';

/**
 * The documents V-Star needs before a viewing is booked.
 *
 * `ViewingRequirements` is the full section on a listing page, laid out the
 * way she presents it: a heading, the notice, then one row per document.
 * `ViewingChecklist` is the compact form of the same list, for the places a
 * viewing is requested (the enquiry forms and the shortlist), so nobody sends
 * a request without knowing what they will be asked for.
 */
export default function ViewingRequirements({
  items,
}: {
  items: ViewingRequirement[];
}) {
  return (
    <section
      id="viewing-requirements"
      aria-labelledby="viewing-requirements-title"
      className="mt-10 scroll-mt-28"
    >
      <h2
        id="viewing-requirements-title"
        className="font-display text-[1.3rem] tracking-display text-ink"
      >
        Viewing requirements
      </h2>
      <div aria-hidden className="mt-3.5 h-px w-full bg-mist-edge" />
      <p className="mt-4 max-w-[38rem] text-[0.98rem] font-bold leading-[1.55] text-accent-deep">
        Please note, the following {items.length === 1 ? 'document is' : 'documents are'}{' '}
        REQUIRED to schedule a viewing of this property.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-sm border border-brand/30 bg-brand-wash px-4 py-4 sm:px-5"
          >
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-mist"
            >
              <RequirementIcon id={item.id} size={21} />
            </span>
            <p className="min-w-0 text-[0.95rem] leading-[1.6] text-ink-soft">
              <strong className="font-bold text-ink">{item.term}</strong> {item.rest}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ViewingChecklist({
  items,
  heading = 'Required before a viewing',
  showAppliesTo = false,
  className = '',
}: {
  items: ViewingRequirement[];
  heading?: string;
  /** Label each line with who it applies to, when no single listing is in view. */
  showAppliesTo?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[0.8rem] font-bold text-ink">{heading}</p>
      <ul className="mt-2.5 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-deep text-mist"
            >
              <RequirementIcon id={item.id} size={13} />
            </span>
            <p className="min-w-0 text-[0.84rem] leading-[1.55] text-ink-mute">
              <strong className="font-bold text-ink-soft">{item.term}</strong>{' '}
              {showAppliesTo ? (
                <span className="text-ink-faint">({item.appliesTo.toLowerCase()})</span>
              ) : (
                item.rest
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RequirementIcon({ id, size }: { id: ViewingRequirement['id']; size: number }) {
  if (id === 'screening') {
    // An ID card: photo block and two text lines.
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2.75" y="5" width="18.5" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="8.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5.5 15.5c.6-1.4 1.7-2.1 3-2.1s2.4.7 3 2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M14.5 10h4M14.5 13.5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  // A letter with a tick: the pre-approval or bank letter.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 2.75h8.2L19 7.5v12.75a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 2.75V7.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.75 14.25l2.1 2.1 4.4-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
