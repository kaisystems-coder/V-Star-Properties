-- Tenant isolation tests (guidelines section 11): {anon, customer, staff,
-- owner, multi-tenant user, suspended tenant} x {select, insert, update,
-- delete} x {own tenant, other tenant}, plus storage. Run the whole file in
-- one go; it creates fixture tenants/users/rows in a transaction and ROLLS BACK.
-- Each check raises 'FAIL [...]' on a mismatch.
-- Tenant A is V-Star (by slug); B and C are throwaway fixtures.
begin;

create temp table fx on commit drop as
select (select id from public.tenants where slug = 'v-star-properties') a,
       gen_random_uuid() b, gen_random_uuid() c,
       (select user_id from public.memberships m join public.tenants t on t.id = m.tenant_id
         where t.slug = 'v-star-properties' and m.role = 'owner' limit 1) ua_owner,
       gen_random_uuid() ua_staff, gen_random_uuid() ua_customer,
       gen_random_uuid() ub_owner, gen_random_uuid() uab, gen_random_uuid() uc_owner,
       gen_random_uuid() la_hidden;
grant select on fx to anon, authenticated;

insert into public.tenants (id, slug, name) select b, 'iso-tenant-b', 'Isolation B' from fx;
insert into public.tenants (id, slug, name, status) select c, 'iso-tenant-c', 'Isolation C', 'suspended' from fx;
insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', u, 'authenticated', 'authenticated', 'iso-' || u || '@example.invalid'
from fx, unnest(array[ua_staff, ua_customer, ub_owner, uab, uc_owner]) u;
insert into public.memberships (user_id, tenant_id, role)
select ua_staff, a, 'staff' from fx union all
select ua_customer, a, 'customer' from fx union all
select ub_owner, b, 'owner' from fx union all
select uab, a, 'staff' from fx union all
select uab, b, 'customer' from fx union all
select uc_owner, c, 'owner' from fx;
insert into public.listings (id, tenant_id, slug, title, listing_type, property_type, location, region, is_published)
select la_hidden, a, 'iso-a-hidden', 'iso', 'Sale', 'House', 'x', 'x', false from fx union all
select gen_random_uuid(), b, 'iso-b-live', 'iso', 'Sale', 'House', 'x', 'x', true from fx union all
select gen_random_uuid(), b, 'iso-b-hidden', 'iso', 'Sale', 'House', 'x', 'x', false from fx union all
select gen_random_uuid(), c, 'iso-c-hidden', 'iso', 'Sale', 'House', 'x', 'x', false from fx;


-- ===== anon =====
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where tenant_id = (select b from fx)$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [anon: reads published B] expected 1, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where tenant_id = (select a from fx) and not is_published$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [anon: cannot read unpublished A] expected 0, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.tenants$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [anon: cannot read tenants] expected 0, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.memberships$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [anon: cannot read memberships] expected 0, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from storage.objects where bucket_id = 'listing-photos'$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [anon: cannot list photo objects] expected 0, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select a from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [anon: cannot insert] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute $q$update public.listings set title = 'hacked' where tenant_id = (select a from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [anon: cannot update] expected 0 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$delete from public.listings where tenant_id = (select b from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [anon: cannot delete] expected 0 rows, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into storage.objects (bucket_id, name) values ('listing-photos', (select a from fx)::text || '/iso/x.jpg')$q$; raise exception 'FAIL [anon: cannot upload] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
reset role;

-- ===== A owner =====
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select ua_owner from fx), 'role', 'authenticated')::text, true);
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where id = (select la_hidden from fx)$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [A owner: reads own unpublished] expected 1, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where tenant_id = (select b from fx) and not is_published$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [A owner: cannot read B unpublished] expected 0, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.tenants$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [A owner: sees only own tenant] expected 1, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select b from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [A owner: cannot insert into B] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ begin begin execute $q$update public.listings set tenant_id = (select b from fx) where id = (select la_hidden from fx)$q$; raise exception 'FAIL [A owner: cannot move own row to B] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute $q$update public.listings set title = 'hacked' where tenant_id = (select b from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [A owner: cannot update B] expected 0 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$delete from public.listings where tenant_id = (select b from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [A owner: cannot delete B] expected 0 rows, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.memberships (user_id, tenant_id, role) values ((select ua_owner from fx), (select b from fx), 'owner')$q$; raise exception 'FAIL [A owner: cannot add self to B] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ begin begin execute $q$insert into storage.objects (bucket_id, name) values ('listing-photos', (select b from fx)::text || '/iso/x.jpg')$q$; raise exception 'FAIL [A owner: cannot upload into B folder] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select a from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL [A owner: can insert into A] expected 1 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$delete from public.listings where tenant_id = (select a from fx) and slug like 'iso-%' and id <> (select la_hidden from fx)$q$; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL [A owner: can delete in A] expected 1 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$insert into storage.objects (bucket_id, name) values ('listing-photos', (select a from fx)::text || '/iso/x.jpg')$q$; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL [A owner: can upload into A folder] expected 1 rows, got %', n; end if; end $d$;
reset role;

-- ===== A staff =====
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select ua_staff from fx), 'role', 'authenticated')::text, true);
do $d$ declare n int; begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select a from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL [A staff: can insert into A] expected 1 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$update public.listings set title = 'edited' where id = (select la_hidden from fx)$q$; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL [A staff: can update A] expected 1 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$delete from public.listings where id = (select la_hidden from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [A staff: cannot delete (admin only)] expected 0 rows, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.memberships (user_id, tenant_id, role) values ((select ub_owner from fx), (select a from fx), 'owner')$q$; raise exception 'FAIL [A staff: cannot manage memberships] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select b from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [A staff: cannot insert into B] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
reset role;

-- ===== A customer =====
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select ua_customer from fx), 'role', 'authenticated')::text, true);
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select a from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [A customer: cannot insert] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute $q$update public.listings set title = 'x' where tenant_id = (select a from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [A customer: cannot update] expected 0 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$delete from public.listings where tenant_id = (select a from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [A customer: cannot delete] expected 0 rows, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into storage.objects (bucket_id, name) values ('listing-photos', (select a from fx)::text || '/iso/x.jpg')$q$; raise exception 'FAIL [A customer: cannot upload] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.memberships$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [A customer: reads only own membership] expected 1, got %', n; end if; end $d$;
reset role;

-- ===== B owner =====
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select ub_owner from fx), 'role', 'authenticated')::text, true);
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where id = (select la_hidden from fx)$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [B owner: cannot read A unpublished] expected 0, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from storage.objects where bucket_id = 'listing-photos' and name like (select a from fx)::text || '/%'$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [B owner: cannot list A photos] expected 0, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$update public.listings set title = 'hacked' where tenant_id = (select a from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [B owner: cannot update A] expected 0 rows, got %', n; end if; end $d$;
do $d$ declare n int; begin execute $q$delete from public.listings where tenant_id = (select a from fx)$q$; get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL [B owner: cannot delete A] expected 0 rows, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select a from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [B owner: cannot insert into A] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ begin begin execute $q$insert into storage.objects (bucket_id, name) values ('listing-photos', (select a from fx)::text || '/iso/x.jpg')$q$; raise exception 'FAIL [B owner: cannot upload into A folder] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where tenant_id = (select b from fx) and not is_published$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [B owner: reads own unpublished] expected 1, got %', n; end if; end $d$;
reset role;

-- ===== A staff + B customer =====
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select uab from fx), 'role', 'authenticated')::text, true);
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where id = (select la_hidden from fx)$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [A staff + B customer: reads A unpublished (member)] expected 1, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where tenant_id = (select b from fx) and not is_published$q$ || ') s' into n; if n <> 1 then raise exception 'FAIL [A staff + B customer: reads B unpublished (member)] expected 1, got %', n; end if; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.tenants$q$ || ') s' into n; if n <> 2 then raise exception 'FAIL [A staff + B customer: sees both tenants only] expected 2, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select b from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [A staff + B customer: cannot write B as customer] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select a from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL [A staff + B customer: can write A as staff] expected 1 rows, got %', n; end if; end $d$;
reset role;

-- ===== suspended C owner =====
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select uc_owner from fx), 'role', 'authenticated')::text, true);
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.listings where tenant_id = (select c from fx) and not is_published$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [suspended C owner: cannot read own unpublished] expected 0, got %', n; end if; end $d$;
do $d$ begin begin execute $q$insert into public.listings (tenant_id, slug, title, listing_type, property_type, location, region) values ((select c from fx), 'iso-' || gen_random_uuid(), 'iso', 'Sale', 'House', 'x', 'x')$q$; raise exception 'FAIL [suspended C owner: cannot insert] statement was allowed'; exception when others then if sqlerrm like 'FAIL%' then raise; end if; end; end $d$;
do $d$ declare n int; begin execute 'select count(*) from (' || $q$select 1 from public.tenants$q$ || ') s' into n; if n <> 0 then raise exception 'FAIL [suspended C owner: cannot see tenant] expected 0, got %', n; end if; end $d$;
reset role;

select 'all isolation checks passed' as result;
rollback;
