-- Core multi-tenancy: tenants, memberships, helper functions and their policies.
-- Shared across every client site on this Supabase project. Follows
-- .claude/multi-tenant-supabase-guidelines.md sections 1-3 verbatim.

create extension if not exists pgcrypto;
create schema if not exists private;  -- not exposed via the API
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);
alter table public.tenants enable row level security;

create table public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('owner','admin','staff','customer')),
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);
create index memberships_tenant_idx on public.memberships (tenant_id);
alter table public.memberships enable row level security;

create or replace function private.is_member(_tenant uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.tenants t on t.id = m.tenant_id
    where m.user_id = (select auth.uid())
      and m.tenant_id = _tenant
      and t.status = 'active'
  );
$$;

create or replace function private.has_role(_tenant uuid, _roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.memberships m
    join public.tenants t on t.id = m.tenant_id
    where m.user_id = (select auth.uid())
      and m.tenant_id = _tenant
      and m.role = any(_roles)
      and t.status = 'active'
  );
$$;

revoke execute on function private.is_member(uuid) from public, anon;
revoke execute on function private.has_role(uuid, text[]) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, text[]) to authenticated;

-- tenant_id can never be changed after insert
create or replace function private.forbid_tenant_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'tenant_id is immutable';
  end if;
  return new;
end $$;

-- Stamps updated_at on every write; shared by every tenant table that has one.
create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- tenants: members can read their own tenant; no client-side writes (use service role / admin tooling)
create policy tenants_member_read on public.tenants
  for select to authenticated using (private.is_member(id));

-- memberships: see your own rows; owners manage their tenant's rows
create policy memberships_self_read on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or private.has_role(tenant_id, array['owner','admin']));
create policy memberships_owner_insert on public.memberships
  for insert to authenticated with check (private.has_role(tenant_id, array['owner']));
create policy memberships_owner_update on public.memberships
  for update to authenticated
  using (private.has_role(tenant_id, array['owner']))
  with check (private.has_role(tenant_id, array['owner']));
create policy memberships_owner_delete on public.memberships
  for delete to authenticated using (private.has_role(tenant_id, array['owner']));
