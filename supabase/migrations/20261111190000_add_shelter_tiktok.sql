alter table public.shelters
  add column if not exists tiktok_url text;

alter table public.shelters
  drop constraint if exists shelters_tiktok_url_check;

alter table public.shelters
  add constraint shelters_tiktok_url_check
  check (tiktok_url ~ '^https://' and char_length(tiktok_url) <= 300);

grant select (tiktok_url) on public.shelters to anon, authenticated;
