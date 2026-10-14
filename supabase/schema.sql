-- V-Star Properties: Supabase schema.
--
-- Mirrors types/listing.ts and types/agent.ts one to one (camelCase -> snake_case),
-- so the five functions in lib/listings.ts swap to Supabase queries without any
-- component changing. Run this in the Supabase SQL editor, then
-- `node supabase/seed.mjs` to load her 138 listings.

create table if not exists public.listings (
  id            text primary key,
  slug          text not null unique,
  title         text not null,
  listing_type  text not null check (listing_type in ('Sale', 'Rent')),
  property_type text not null check (property_type in ('House', 'Apartment', 'Townhouse', 'Villa', 'Land', 'Commercial')),
  status        text not null default 'Active' check (status in ('Active', 'Pending', 'Sold')),
  price         numeric not null default 0,          -- TTD; monthly if Rent; 0 = price on request
  location      text not null,
  region        text not null,
  beds          numeric,
  baths         numeric,
  sqft          integer,
  lot_size      text,
  year_built    integer,
  description   text not null default '',
  amenities     text[] not null default '{}',
  images        text[] not null default '{}',        -- Supabase Storage public URLs once migrated
  featured      boolean not null default false,
  date_listed   date not null default current_date,
  coords        jsonb,                               -- { "lat": 10.27, "lng": -61.46 }
  agent_id      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists listings_region_idx on public.listings (region);
create index if not exists listings_type_idx on public.listings (listing_type, property_type);
create index if not exists listings_date_idx on public.listings (date_listed desc);

create table if not exists public.agents (
  id               text primary key,
  slug             text not null unique,
  name             text not null,
  role             text not null,
  territories      text[] not null default '{}',
  specialties      text[] not null default '{}',
  bio              text not null default '',
  phone            text not null,
  email            text not null,
  image            text not null,
  image_is_logo    boolean not null default false,
  joined           integer not null,
  experience_label text,
  languages        text[] not null default '{English}',
  credential       text
);

-- Enquiries from the listing, agent, contact and valuation forms.
create table if not exists public.enquiries (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('listing', 'agent', 'contact', 'valuation')),
  listing_id  text references public.listings (id) on delete set null,
  name        text not null,
  email       text,
  phone       text,
  message     text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

-- Row level security: the public reads listings and agents and may submit
-- enquiries; only a signed-in user (her, through /admin) writes listings.
alter table public.listings  enable row level security;
alter table public.agents    enable row level security;
alter table public.enquiries enable row level security;

create policy "listings are public"   on public.listings  for select using (true);
create policy "agents are public"     on public.agents    for select using (true);
create policy "admin writes listings" on public.listings  for all to authenticated using (true) with check (true);
create policy "anyone can enquire"    on public.enquiries for insert with check (true);
create policy "admin reads enquiries" on public.enquiries for select to authenticated using (true);

-- Photos: create a public bucket called `listing-photos` in Storage.
