/**
 * Supabase connection settings. Both values are public by design: the
 * publishable key only ever acts as `anon` or as the signed-in user, and row
 * level security does the enforcing.
 *
 * The tenant is NOT here. It is server-side config (`TENANT_ID`), resolved per
 * deployment and handed to the admin as a prop — never read from the browser.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const PHOTO_BUCKET = 'listing-photos';

/** Public URL prefix of the photo bucket, for next/image and for path maths. */
export const PHOTO_PUBLIC_PREFIX = SUPABASE_URL + '/storage/v1/object/public/' + PHOTO_BUCKET + '/';
