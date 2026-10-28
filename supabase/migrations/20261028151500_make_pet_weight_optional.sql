alter table public.pets
  alter column weight drop not null;

revoke all on public.pets from anon, authenticated;

grant select on public.pets to anon, authenticated;
grant insert, update on public.pets to authenticated;