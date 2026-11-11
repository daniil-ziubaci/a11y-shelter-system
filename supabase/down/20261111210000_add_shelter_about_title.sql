-- Откат: убирает заголовки страницы «О приюте». Данные колонок теряются.
alter table public.shelters
  drop constraint if exists shelters_about_title_check,
  drop constraint if exists shelters_about_title_en_check,
  drop constraint if exists shelters_about_title_ro_check;

alter table public.shelters
  drop column if exists about_title,
  drop column if exists about_title_en,
  drop column if exists about_title_ro;
