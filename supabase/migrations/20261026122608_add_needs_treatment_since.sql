alter table public.pets 
  add column needs_treatment_since 
  timestamptz;

revoke all on public.pets from anon, authenticated;
grant select on public.pets to anon, authenticated;
grant insert, update on public.pets to authenticated;