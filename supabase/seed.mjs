// Loads supabase/seed-listings.json into the `listings` table through the
// Supabase REST API. No dependency needed.
//
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.mjs
//
// The service-role key bypasses row level security, so run this locally only
// and never ship that key to the browser.
import { readFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}

const snake = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
const listings = JSON.parse(readFileSync(new URL('./seed-listings.json', import.meta.url), 'utf8'));
const rows = listings.map((l) =>
  Object.fromEntries(Object.entries({ ...l, agentId: 'ag-01' }).map(([k, v]) => [snake(k), v ?? null])),
);

const res = await fetch(url + '/rest/v1/listings', {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  },
  body: JSON.stringify(rows),
});
console.log(res.ok ? `Seeded ${rows.length} listings.` : `Failed: ${res.status} ${await res.text()}`);
