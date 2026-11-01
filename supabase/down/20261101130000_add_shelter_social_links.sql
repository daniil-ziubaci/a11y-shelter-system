-- После отката ссылки на соцсети теряются: колонки удаляются вместе с проверками https и длины.
alter table public.shelters
  drop column instagram_url,
  drop column viber_url,
  drop column telegram_url;
