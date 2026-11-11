alter table public.shelters
  add column name_en text,
  add column name_ro text,
  add column brand_path text;

alter table public.shelters
  add constraint shelters_name_en_check
  check (char_length(btrim(name_en)) between 1 and 150);

alter table public.shelters
  add constraint shelters_name_ro_check
  check (char_length(btrim(name_ro)) between 1 and 150);

alter table public.shelters
  add constraint shelters_brand_path_check
  check (char_length(brand_path) between 1 and 200);
