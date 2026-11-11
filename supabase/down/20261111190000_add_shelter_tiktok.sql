-- Откат: убирает ссылку на TikTok. Данные колонки теряются.
alter table public.shelters
  drop constraint if exists shelters_tiktok_url_check;

alter table public.shelters
  drop column if exists tiktok_url;
