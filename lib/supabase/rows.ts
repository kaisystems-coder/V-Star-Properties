import type { Listing, ListingDraft } from '@/types/listing';

/** A `public.listings` row as PostgREST returns it. */
export interface ListingRow {
  id: string;
  tenant_id: string;
  slug: string;
  title: string;
  listing_type: Listing['listingType'];
  property_type: Listing['propertyType'];
  status: Listing['status'];
  price: number | string;
  location: string;
  region: string;
  beds: number | string | null;
  baths: number | string | null;
  sqft: number | null;
  lot_size: string | null;
  year_built: number | null;
  description: string;
  amenities: string[];
  images: string[];
  featured: boolean;
  date_listed: string;
  coords: { lat: number; lng: number } | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// numeric columns come back as strings when they carry a fraction.
const num = (v: number | string | null) => (v === null ? null : Number(v));

export function fromRow(r: ListingRow): Listing {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    listingType: r.listing_type,
    propertyType: r.property_type,
    status: r.status,
    price: Number(r.price),
    location: r.location,
    region: r.region,
    beds: num(r.beds),
    baths: num(r.baths),
    sqft: r.sqft,
    ...(r.lot_size ? { lotSize: r.lot_size } : {}),
    ...(r.year_built ? { yearBuilt: r.year_built } : {}),
    description: r.description,
    amenities: r.amenities,
    images: r.images,
    featured: r.featured,
    dateListed: r.date_listed,
    ...(r.coords ? { coords: r.coords } : {}),
    isPublished: r.is_published,
  };
}

/** The writable columns of a draft. tenant_id, id and slug are set by the caller. */
export function toRow(d: ListingDraft) {
  return {
    title: d.title.trim(),
    listing_type: d.listingType,
    property_type: d.propertyType,
    status: d.status,
    price: d.price,
    location: d.location.trim(),
    region: d.region,
    beds: d.beds,
    baths: d.baths,
    sqft: d.sqft,
    lot_size: d.lotSize?.trim() || null,
    year_built: d.yearBuilt ?? null,
    description: d.description,
    amenities: d.amenities,
    images: d.images,
    featured: d.featured,
    date_listed: d.dateListed,
    coords: d.coords ?? null,
    is_published: d.isPublished ?? true,
  };
}
