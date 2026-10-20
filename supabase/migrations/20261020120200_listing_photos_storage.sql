-- Public bucket for listing photos (they appear on live sites), every object
-- under {tenant_id}/. Reads are public by URL; writes are tenant-scoped.
-- Guidelines section 7.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 15728640,  -- 15 MB
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Listing the bucket (the public URL needs no policy) is for members only.
create policy listing_photos_read on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos'
         and private.is_member(((storage.foldername(name))[1])::uuid));

create policy listing_photos_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos'
              and private.has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','staff']));

create policy listing_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-photos'
         and private.has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','staff']))
  with check (bucket_id = 'listing-photos'
         and private.has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','staff']));

create policy listing_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos'
         and private.has_role(((storage.foldername(name))[1])::uuid, array['owner','admin']));
