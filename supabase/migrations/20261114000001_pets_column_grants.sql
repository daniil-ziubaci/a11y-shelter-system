revoke insert, update on table public.pets from authenticated;

grant insert (id, name, species, sex, birth_date, is_age_approximate, size, health, description,
  photo_url, photo_alt, status, needs_treatment_since)
  on table public.pets to authenticated;

grant update (name, species, sex, birth_date, is_age_approximate, size, health, description,
  photo_url, photo_alt, status, needs_treatment_since)
  on table public.pets to authenticated;
