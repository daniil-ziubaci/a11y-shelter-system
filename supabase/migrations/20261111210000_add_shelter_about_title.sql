alter table public.shelters
  add column if not exists about_title text,
  add column if not exists about_title_en text,
  add column if not exists about_title_ro text;

alter table public.shelters
  drop constraint if exists shelters_about_title_check,
  drop constraint if exists shelters_about_title_en_check,
  drop constraint if exists shelters_about_title_ro_check;

alter table public.shelters
  add constraint shelters_about_title_check
    check (about_title is null or char_length(about_title) between 1 and 200),
  add constraint shelters_about_title_en_check
    check (about_title_en is null or char_length(about_title_en) between 1 and 200),
  add constraint shelters_about_title_ro_check
    check (about_title_ro is null or char_length(about_title_ro) between 1 and 200);

grant select (about_title, about_title_en, about_title_ro)
  on public.shelters to anon, authenticated;
