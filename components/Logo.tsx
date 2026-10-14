/**
 * The wordmark and every brand fact the site prints. Contact details and
 * social links live here and nowhere else.
 */
export const BRAND = {
  name: 'V-Star',
  suffix: 'Properties',
  legalName: 'V-Star Properties Company Limited',
  /** The brand line from the logo, set in the serif wherever it appears. */
  tagline: 'Efficient Real Estate Services, Delivering Successful Results is our Purpose',
  phone: '+1 (868) 718-7839',
  /**
   * Digits only, country code first, no +. This is the wa.me path segment.
   * In Trinidad WhatsApp is the business line, not a secondary channel, so it
   * is a first-class brand field rather than a formatting of `phone`.
   */
  whatsapp: '18687187839',
  email: 'v-starproperty@outlook.com',
  address: 'San Fernando, Trinidad and Tobago',
  /** The full-colour logo, for white grounds only (brand guide §04). */
  logo: '/brand/v-star-logo.jpg',
  socials: [
    {
      id: 'facebook',
      label: 'Facebook',
      handle: 'V-Star Properties Company Ltd',
      href: 'https://www.facebook.com/VStarProperties/',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@vstar_property',
      href: 'https://www.instagram.com/vstar_property/',
    },
    {
      id: 'mybunchofkeys',
      label: 'My Bunch of Keys',
      handle: 'V-Star Properties',
      href: 'https://mybunchofkeys.com/author/vstarproperties/',
    },
  ],
} as const;

export type SocialId = (typeof BRAND.socials)[number]['id'];

/**
 * A header-sized lockup of the logo: the twin rooflines, then "V-Star" with
 * the V-S in blue and the "tar" in green exactly as the full logo splits it.
 * On charcoal the blue half turns white, as the guide's reversed logo asks.
 */
export default function Logo({ tone = 'ink' }: { tone?: 'ink' | 'mist' }) {
  const onDark = tone === 'mist';

  return (
    <span className="inline-flex items-center gap-2">
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden className="shrink-0">
        <path
          d="M2 14 L12.5 3.5 L23 14"
          fill="none"
          stroke="#4D93C8"
          strokeWidth="3.2"
          strokeLinecap="square"
        />
        <path
          d="M17.5 16 L23 10.5 L28.5 16"
          fill="none"
          stroke={onDark ? '#A5CF5E' : '#2568A7'}
          strokeWidth="2.8"
          strokeLinecap="square"
        />
        <g fill={onDark ? 'rgba(255,255,255,0.7)' : '#8A9096'}>
          <rect x="10.2" y="9.6" width="2" height="2" />
          <rect x="12.8" y="9.6" width="2" height="2" />
          <rect x="10.2" y="12.2" width="2" height="2" />
          <rect x="12.8" y="12.2" width="2" height="2" />
        </g>
      </svg>
      <span className="inline-flex items-baseline gap-[0.35rem]">
        <span className="font-serif text-[1.45rem] leading-none tracking-[-0.01em]">
          <span className={onDark ? 'text-mist' : 'text-brand'}>V-S</span>
          <span className="text-accent">tar</span>
        </span>{' '}
        <span
          className={
            'font-sans text-[0.6rem] font-bold uppercase tracking-[0.16em] xs:text-[0.66rem] xs:tracking-[0.2em] ' +
            (onDark ? 'text-mist/70' : 'text-ink-mute')
          }
        >
          {BRAND.suffix}
        </span>
      </span>
    </span>
  );
}

/** Social icons, drawn at one stroke weight so the three read as a set. */
export function SocialIcon({ id, className }: { id: SocialId; className?: string }) {
  if (id === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className={className}>
        <path
          fill="currentColor"
          d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z"
        />
      </svg>
    );
  }
  if (id === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className={className}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    );
  }
  // My Bunch of Keys: a key, since the portal's own mark is a keyring.
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className={className}>
      <circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 12h8.5M17 12v3M20 12v2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
