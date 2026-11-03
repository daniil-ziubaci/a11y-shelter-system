alter table public.projects
  add column translations jsonb not null default '{}'::jsonb
  constraint projects_translations_check check (
    jsonb_typeof(translations) = 'object'
    and octet_length(translations::text) <= 20000
  );

grant update (translations) on public.projects to authenticated;
