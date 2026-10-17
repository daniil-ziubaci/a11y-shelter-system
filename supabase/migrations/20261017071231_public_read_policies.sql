create policy "Anyone can read pets"
  on public.pets
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can read shelters"
  on public.shelters
  for select
  to anon, authenticated
  using (true);