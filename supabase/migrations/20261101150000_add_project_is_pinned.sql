alter table public.projects
  add column if not exists is_pinned boolean not null default false;

revoke insert (is_pinned), update (is_pinned) on public.projects from anon, authenticated;
