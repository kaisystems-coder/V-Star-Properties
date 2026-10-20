'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

/**
 * The admin's browser client: publishable key + her session, nothing more.
 * Every read and write it makes is checked by RLS against her membership.
 */
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'vstar-admin-auth' },
  });
  return client;
}
