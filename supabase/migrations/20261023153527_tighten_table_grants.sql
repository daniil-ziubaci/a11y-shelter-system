revoke all on public.shelters, public.pets, public.shelter_members from anon, authenticated;

grant select on public.shelters to anon, authenticated;

grant select on public.pets to anon, authenticated;
grant insert, update on public.pets to authenticated;

grant select on public.shelter_members to authenticated;