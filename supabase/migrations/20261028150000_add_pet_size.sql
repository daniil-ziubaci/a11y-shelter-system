alter table public.pets
  add column size text;

alter table public.pets
  add constraint pets_size_values check (size in ('мелкая', 'средняя', 'крупная')),
  add constraint pets_size_only_dogs check (size is null or species = 'собака');

revoke all on public.pets from anon, authenticated;

grant select on public.pets to anon, authenticated;
grant insert, update on public.pets to authenticated;