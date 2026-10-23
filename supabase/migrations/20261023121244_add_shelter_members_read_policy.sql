create policy "Members can read their own memberships"
  on public.shelter_members
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
