import { revalidateTag } from 'next/cache';
import { LISTINGS_TAG } from '@/lib/listings';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { TENANT_ID } from '@/lib/supabase/tenant';

/**
 * Called by /admin after every save so the public pages pick up the change.
 *
 * Only staff of THIS site's tenant may trigger it. The caller sends their
 * Supabase session token; we verify it with Supabase Auth, then read their
 * membership for the server-resolved TENANT_ID using that same token (RLS
 * lets a user read their own membership rows). No service-role key involved.
 */
export async function POST(request: Request) {
  const tenant = TENANT_ID;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!tenant || !token) return Response.json({ ok: false }, { status: 401 });

  const headers = { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer ' + token };
  const user = await fetch(SUPABASE_URL + '/auth/v1/user', { headers, cache: 'no-store' });
  if (!user.ok) return Response.json({ ok: false }, { status: 401 });
  const { id } = (await user.json()) as { id: string };

  const res = await fetch(
    SUPABASE_URL +
      '/rest/v1/memberships?select=role&user_id=eq.' +
      id +
      '&tenant_id=eq.' +
      tenant +
      '&role=in.(owner,admin,staff)',
    { headers, cache: 'no-store' },
  );
  const rows = res.ok ? ((await res.json()) as { role: string }[]) : [];
  if (rows.length === 0) return Response.json({ ok: false }, { status: 403 });

  // expire 0: she checks the site right after saving, so the next request
  // must render fresh rather than serve the stale page once.
  revalidateTag(LISTINGS_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
