alter table public.projects
  add column if not exists help_kinds text[] not null default array['money']::text[];

alter table public.projects
  add constraint projects_help_kinds_valid check (
    cardinality(help_kinds) >= 1
    and help_kinds <@ array['things', 'money']::text[]
  );

grant select (help_kinds) on public.projects to anon, authenticated;
grant insert (help_kinds), update (help_kinds) on public.projects to authenticated;
