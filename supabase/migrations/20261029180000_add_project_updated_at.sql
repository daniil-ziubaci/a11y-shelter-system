alter table public.projects
  add column updated_at timestamptz not null default now();

create function public.projects_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.projects_set_updated_at() from public, anon, authenticated;

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.projects_set_updated_at();