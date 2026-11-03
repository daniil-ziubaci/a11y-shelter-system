alter table public.shelters
  add column content_language text not null default 'ru'
  constraint shelters_content_language_check check (content_language in ('ru', 'ro', 'en'));
