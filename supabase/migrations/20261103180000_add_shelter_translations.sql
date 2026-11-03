alter table public.shelters
  add column translations jsonb not null default '{}'::jsonb
  constraint shelters_translations_check check (
    jsonb_typeof(translations) = 'object'
    and octet_length(translations::text) <= 20000
  );
