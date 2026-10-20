# Supabase

This site is one tenant on the shared multi-tenant project `ezotkeijhffwylgsjkhq`
(Pro plan, ca-central-1). Rules: `.claude/multi-tenant-supabase-guidelines.md` on the Desktop.

| | |
|---|---|
| Tenant | `v-star-properties`, id `949f81ee-ba83-4f50-ab7c-1c6545759543` |
| Owner login | `v-starproperty@outlook.com` (role `owner`) |
| Listings | `public.listings`, 138 imported 2026-10-20 |
| Photos | public bucket `listing-photos`, under `{tenant_id}/{listing_id}/` |

## Migrations (applied, in order)

1. `20261020120000_core_tenancy.sql`: tenants, memberships, `private.is_member` / `has_role`, immutable-tenant trigger. Shared by every client on the project.
2. `20261020120100_listings.sql`: listings table + RLS (public reads published rows; staff+ write; owner/admin delete).
3. `20261020120200_listing_photos_storage.sql`: photo bucket + tenant-folder policies.

## How the site uses it

- **Public pages** read published listings as `anon` through PostgREST (`lib/listings.ts`), cached by Next and tagged `listings`.
- **/admin** signs in with Supabase Auth and writes as her (`lib/admin/listings.ts`). RLS checks every write against her membership.
- After each save the admin calls `/api/revalidate`. It verifies her token and her membership of `TENANT_ID`, then refreshes every page.
- No service-role key anywhere in the app.

## Tests

`tests/isolation.sql` runs the guidelines' section 11 matrix (anon, customer, staff, owner, a user in two tenants, a suspended tenant; read/write/delete; own vs other tenant; storage). Paste the whole file into the SQL editor. It rolls back, and it either ends with `all isolation checks passed` or stops at the first `FAIL [...]`.

## Password reset

There is no self-serve reset page yet. To set a new password: Dashboard → Authentication → Users → her user → "Send password recovery", or update it from there.
