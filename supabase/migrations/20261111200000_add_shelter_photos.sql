create table if not exists public.shelter_photos (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  source_name text not null,
  path text not null,
  thumb_path text not null,
  alt text not null,
  alt_en text,
  alt_ro text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shelter_photos_source_name_check check (char_length(source_name) between 1 and 100),
  constraint shelter_photos_path_check check (char_length(path) between 1 and 300),
  constraint shelter_photos_thumb_path_check check (char_length(thumb_path) between 1 and 300),
  constraint shelter_photos_alt_check check (char_length(alt) between 1 and 200),
  constraint shelter_photos_alt_en_check check (alt_en is null or char_length(alt_en) between 1 and 200),
  constraint shelter_photos_alt_ro_check check (alt_ro is null or char_length(alt_ro) between 1 and 200),
  constraint shelter_photos_position_check check (position >= 0),
  constraint shelter_photos_source_unique unique (shelter_id, source_name)
);

create index if not exists shelter_photos_shelter_position_idx
  on public.shelter_photos (shelter_id, position);

alter table public.shelter_photos enable row level security;

drop policy if exists "Anyone can read shelter photos" on public.shelter_photos;
create policy "Anyone can read shelter photos"
  on public.shelter_photos
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.shelters s where s.id = shelter_photos.shelter_id
    )
  );

revoke all on table public.shelter_photos from anon, authenticated;
grant select on table public.shelter_photos to anon, authenticated;
grant all on table public.shelter_photos to service_role;
