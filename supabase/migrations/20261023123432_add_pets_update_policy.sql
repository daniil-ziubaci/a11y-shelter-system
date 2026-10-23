create policy "Members can update pets of their shelter"
  on public.pets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = pets.shelter_id
    )
  )
  with check (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = pets.shelter_id
    )
  );