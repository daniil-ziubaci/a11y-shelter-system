alter table public.shelters
  add column instagram_url text constraint shelters_instagram_url_check check (instagram_url ~ '^https://' and char_length(instagram_url) <= 300),
  add column viber_url text constraint shelters_viber_url_check check (viber_url ~ '^https://' and char_length(viber_url) <= 300),
  add column telegram_url text constraint shelters_telegram_url_check check (telegram_url ~ '^https://' and char_length(telegram_url) <= 300);

revoke all on public.shelters from anon, authenticated;
grant select on public.shelters to anon, authenticated;
