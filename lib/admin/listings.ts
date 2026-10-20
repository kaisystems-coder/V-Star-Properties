'use client';

import type { Listing, ListingDraft } from '@/types/listing';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { PHOTO_BUCKET, PHOTO_PUBLIC_PREFIX } from '@/lib/supabase/config';
import { fromRow, toRow, type ListingRow } from '@/lib/supabase/rows';

/**
 * The admin's writes. Every call runs as the signed-in user, sets tenant_id
 * from the server-resolved value it is given, and filters by it as well; RLS
 * rejects anything outside her membership regardless.
 */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Keeps slugs unique when two listings share a title. */
function uniqueSlug(base: string, taken: string[]): string {
  const seed = base || 'listing';
  if (!taken.includes(seed)) return seed;
  let n = 2;
  while (taken.includes(seed + '-' + n)) n += 1;
  return seed + '-' + n;
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(action + ': ' + (error?.message ?? 'no response'));
}

/** Everything of hers, hidden listings included (RLS: member read). */
export async function loadListings(tenantId: string): Promise<Listing[]> {
  const { data, error } = await supabaseBrowser()
    .from('listings')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date_listed', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) fail('Could not load listings', error);
  return (data as ListingRow[]).map(fromRow);
}

export async function createListing(
  tenantId: string,
  draft: ListingDraft,
  takenSlugs: string[],
): Promise<Listing> {
  const { data, error } = await supabaseBrowser()
    .from('listings')
    .insert({
      ...toRow(draft),
      ...(draft.id ? { id: draft.id } : {}),
      tenant_id: tenantId,
      slug: uniqueSlug(slugify(draft.title), takenSlugs),
    })
    .select()
    .single();
  if (error || !data) fail('Could not publish', error);
  return fromRow(data as ListingRow);
}

/**
 * The slug stays put on edits, even when the title changes: it is the URL
 * people have shared on WhatsApp and Google has indexed.
 */
export async function updateListing(
  tenantId: string,
  id: string,
  draft: ListingDraft,
): Promise<Listing> {
  const { data, error } = await supabaseBrowser()
    .from('listings')
    .update(toRow(draft))
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();
  if (error || !data) fail('Could not save', error);
  return fromRow(data as ListingRow);
}

export async function deleteListing(tenantId: string, id: string): Promise<void> {
  const { error } = await supabaseBrowser()
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);
  if (error) fail('Could not delete', error);
  // Then its photo folder. Best effort: an orphaned photo costs storage, not
  // correctness, so a failure here must not undo a delete that succeeded.
  const storage = supabaseBrowser().storage.from(PHOTO_BUCKET);
  const folder = tenantId + '/' + id;
  const { data } = await storage.list(folder, { limit: 1000 });
  if (data?.length) await storage.remove(data.map((f) => folder + '/' + f.name));
}

/** Removes photos from storage, ignoring anything not in her own folder. */
export async function removePhotos(tenantId: string, urls: string[]): Promise<void> {
  const own = PHOTO_PUBLIC_PREFIX + tenantId + '/';
  const paths = urls.filter((u) => u.startsWith(own)).map((u) => u.slice(PHOTO_PUBLIC_PREFIX.length));
  if (paths.length) await supabaseBrowser().storage.from(PHOTO_BUCKET).remove(paths);
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_EDGE = 2560;

/**
 * Phone photos arrive at 4000px+ and 5-10 MB. Anything larger than the site
 * ever shows is scaled down to 2560px on the long edge and re-encoded as JPEG
 * before upload, so her storage and the visitors' data plans are spared.
 */
async function prepare(file: File): Promise<{ blob: Blob; type: string; ext: string }> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(file.name + ' is not a JPEG, PNG or WebP photo.');
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(file.name + ' could not be read as a photo.');
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 3_000_000) {
    bitmap.close();
    return { blob: file, type: file.type, ext: file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg' };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
  if (!blob) throw new Error(file.name + ' could not be resized.');
  return { blob, type: 'image/jpeg', ext: 'jpg' };
}

/** Uploads one photo into {tenant}/{listing}/ and returns its public URL. */
export async function uploadPhoto(tenantId: string, listingId: string, file: File): Promise<string> {
  const { blob, type, ext } = await prepare(file);
  const path =
    tenantId + '/' + listingId + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext;
  const { error } = await supabaseBrowser()
    .storage.from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: type, cacheControl: '31536000', upsert: false });
  if (error) fail('Could not upload ' + file.name, error);
  return PHOTO_PUBLIC_PREFIX + path;
}

/**
 * Asks the site to rebuild its pages from the new data. A failure leaves the
 * hourly refresh to pick the change up, so it is reported but not fatal.
 */
export async function refreshSite(): Promise<boolean> {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  const res = await fetch('/api/revalidate', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
  }).catch(() => null);
  return !!res?.ok;
}
