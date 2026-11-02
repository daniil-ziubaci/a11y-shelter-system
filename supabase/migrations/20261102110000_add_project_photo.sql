alter table public.projects
  add column if not exists photo_path text,
  add column if not exists photo_alt text;

alter table public.projects
  add constraint projects_photo_valid check (
    (photo_path is null and photo_alt is null)
    or (
      photo_path is not null
      and photo_alt is not null
      and char_length(btrim(photo_path)) between 1 and 300
      and char_length(btrim(photo_alt)) between 1 and 200
    )
  );

grant select (photo_path, photo_alt) on public.projects to anon, authenticated;
grant insert (photo_path, photo_alt), update (photo_path, photo_alt) on public.projects to authenticated;
