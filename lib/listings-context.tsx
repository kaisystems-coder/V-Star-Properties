'use client';

import { createContext, useContext } from 'react';
import type { Listing } from '@/types/listing';

/**
 * Her published listings, fetched once on the server by the root layout and
 * handed to every client component (search, browsers, detail, saved).
 *
 * A context, not a module-level store: a store singleton on the server would
 * be shared between requests, and the data now arrives from the server anyway.
 */
const ListingsContext = createContext<Listing[]>([]);

export function ListingsProvider({
  listings,
  children,
}: {
  listings: Listing[];
  children: React.ReactNode;
}) {
  return <ListingsContext.Provider value={listings}>{children}</ListingsContext.Provider>;
}

export function useListings(): Listing[] {
  return useContext(ListingsContext);
}
