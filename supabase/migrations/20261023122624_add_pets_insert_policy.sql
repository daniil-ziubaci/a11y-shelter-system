create policy "Members can add pets to their shelter"
  on public.pets
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = pets.shelter_id
    )
  );