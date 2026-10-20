-- Property listings, for any real-estate client on the shared project.
-- Columns mirror types/listing.ts one to one (camelCase -> snake_case).
-- Template: guidelines section 4.

create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  slug          text not null check (slug ~ '^[a-z0-9-]+$'),
  title         text not null,
  listing_type  text not null check (listing_type in ('Sale','Rent')),
  property_type text not null check (property_type in ('House','Apartment','Townhouse','Villa','Land','Commercial')),
  status        text not null default 'Active' check (status in ('Active','Pending','Sold')),
  price         numeric(14,2) not null default 0 check (price >= 0),  -- TTD; monthly if Rent; 0 = price on request
  location      text not null,
  region        text not null,
  beds          numeric(4,1) check (beds >= 0),
  baths         numeric(4,1) check (baths >= 0),
  sqft          integer check (sqft >= 0),
  lot_size      text,
  year_built    integer,
  description   text not null default '',
  amenities     text[] not null default '{}',
  images        text[] not null default '{}',  -- public URLs in the listing-photos bucket
  featured      boolean not null default false,
  date_listed   date not null default current_date,
  coords        jsonb,                         -- { "lat": 10.27, "lng": -61.46 }
  -- Default true (unlike the products template): a listing she saves is meant
  -- to go live. Unticking it hides a listing without deleting it.
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, tenant_id),   -- enables composite FKs from child tables
  unique (tenant_id, slug)  -- slugs are URLs, unique per site
);
create index listings_tenant_idx on public.listings (tenant_id);
create index listings_tenant_date_idx on public.listings (tenant_id, date_listed desc);
alter table public.listings enable row level security;

create trigger listings_tenant_immutable
  before update on public.listings
  for each row execute function private.forbid_tenant_change();

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function private.touch_updated_at();

-- Public site read (only rows explicitly marked public)
create policy listings_public_read on public.listings
  for select to anon, authenticated using (is_published = true);

-- Tenant members read everything of theirs, hidden listings included
create policy listings_member_read on public.listings
  for select to authenticated using (private.is_member(tenant_id));

-- Writes: staff and above, always checked against tenant_id
create policy listings_staff_insert on public.listings
  for insert to authenticated
  with check (private.has_role(tenant_id, array['owner','admin','staff']));
create policy listings_staff_update on public.listings
  for update to authenticated
  using (private.has_role(tenant_id, array['owner','admin','staff']))
  with check (private.has_role(tenant_id, array['owner','admin','staff']));
create policy listings_admin_delete on public.listings
  for delete to authenticated
  using (private.has_role(tenant_id, array['owner','admin']));
