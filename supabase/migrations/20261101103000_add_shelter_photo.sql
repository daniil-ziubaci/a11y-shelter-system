alter table public.shelters
  add column photo_path text constraint shelters_photo_path_length check (char_length(photo_path) between 1 and 300),
  add column photo_alt text constraint shelters_photo_alt_length check (char_length(photo_alt) between 1 and 300),
  add constraint shelters_photo_alt_required check (photo_path is null or photo_alt is not null);

revoke all on public.shelters from anon, authenticated;
grant select on public.shelters to anon, authenticated;
