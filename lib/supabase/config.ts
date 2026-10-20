/**
 * Supabase connection settings. Both values are public by design: the
 * publishable key only ever acts as `anon` or as the signed-in user, and row
 * level security does the enforcing. They default to the shared project so a
 * deploy needs no dashboard setup; env vars still override them.
 *
 * The tenant is NOT here. It is server-side config (lib/supabase/tenant.ts),
 * handed to the admin as a prop — never read from the browser.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ezotkeijhffwylgsjkhq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_wgwiIF4zkI7nHifFV2w99A_fiUstF2_';

export const PHOTO_BUCKET = 'listing-photos';

/** Public URL prefix of the photo bucket, for next/image and for path maths. */
export const PHOTO_PUBLIC_PREFIX = SUPABASE_URL + '/storage/v1/object/public/' + PHOTO_BUCKET + '/';
