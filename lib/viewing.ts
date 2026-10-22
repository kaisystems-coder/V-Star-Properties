import type { Listing } from '@/types/listing';

/**
 * What V-Star needs before a viewing can be booked, in her own wording.
 *
 * One source for every place it appears: the listing page, the viewing and
 * contact forms, the shortlist, the FAQ (and its FAQPage schema) and
 * /llms.txt. Proof of funds only applies to a purchase, so a rental asks for
 * the pre-screening alone.
 */
export type ViewingRequirement = {
  id: 'screening' | 'funds';
  /** The bold lead, e.g. "Pre-screening / ID". */
  term: string;
  /** The rest of the line, read straight after the term. */
  rest: string;
  /** Who it applies to, for places that list both without a listing in view. */
  appliesTo: string;
};

export const SCREENING: ViewingRequirement = {
  id: 'screening',
  term: 'Pre-screening / ID',
  rest: 'required before scheduling a viewing.',
  appliesTo: 'Every viewing',
};

export const FUNDS: ViewingRequirement = {
  id: 'funds',
  term: 'Mortgage Pre-Approval or Proof of Funds',
  rest: 'required before scheduling a viewing.',
  appliesTo: 'Properties for sale',
};

export const ALL_VIEWING_REQUIREMENTS = [SCREENING, FUNDS];

export function viewingRequirementsFor(
  listingType: Listing['listingType'],
): ViewingRequirement[] {
  return listingType === 'Rent' ? [SCREENING] : [SCREENING, FUNDS];
}

/** The plain-text answer used by the FAQ, its schema and /llms.txt. */
export const VIEWING_REQUIREMENTS_ANSWER =
  'Before V-Star can schedule a viewing, every visitor needs pre-screening with a valid ID. To view a property for sale you also need a mortgage pre-approval letter or proof of funds. Have these ready when you request the viewing and it can be booked straight away.';
