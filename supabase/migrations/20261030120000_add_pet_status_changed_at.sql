alter table public.pets
  add column status_changed_at timestamptz not null default now();

create function public.pets_set_status_changed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status_changed_at := now();
  return new;
end;
$$;

revoke all on function public.pets_set_status_changed_at() from public, anon, authenticated;

create trigger pets_set_status_changed_at
before update of status on public.pets
for each row
execute function public.pets_set_status_changed_at();