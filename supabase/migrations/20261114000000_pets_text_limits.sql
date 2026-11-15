alter table public.pets
  add constraint pets_name_length check (
    char_length(name) between 1 and 50 and name !~ '^\s' and name !~ '\s$'
  ),
  add constraint pets_photo_alt_length check (
    char_length(photo_alt) between 1 and 300 and photo_alt !~ '^\s' and photo_alt !~ '\s$'
  ),
  add constraint pets_health_length check (
    char_length(health) between 1 and 500 and health !~ '^\s' and health !~ '\s$'
  ),
  add constraint pets_description_length check (
    char_length(description) between 1 and 3000 and description !~ '^\s' and description !~ '\s$'
  );
