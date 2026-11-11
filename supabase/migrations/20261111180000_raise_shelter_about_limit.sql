alter table public.shelters
  drop constraint if exists shelters_about_length;

alter table public.shelters
  add constraint shelters_about_length check (char_length(about) <= 3000);
