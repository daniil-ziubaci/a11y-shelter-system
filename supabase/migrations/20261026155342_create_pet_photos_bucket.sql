insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "Members upload photos to their shelter folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in (
      select shelter_id::text
      from public.shelter_members
      where user_id = (select auth.uid())
    )
  );

create policy "Photo uploads require second factor"
  on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (
    bucket_id <> 'pet-photos'
    or (select auth.jwt() ->> 'aal') = 'aal2'
  );