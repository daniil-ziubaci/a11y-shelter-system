create table public.pet_internal (
  pet_id uuid primary key references public.pets (id) on delete cascade,
  enclosure text not null
    constraint pet_internal_enclosure_check
    check (char_length(enclosure) between 1 and 40 and enclosure = btrim(enclosure))
);

alter table public.pet_internal enable row level security;

revoke all on public.pet_internal from anon, authenticated;
grant select, insert, update, delete on public.pet_internal to authenticated;

create policy "Members can read enclosures of their shelter"
  on public.pet_internal
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.pets
      join public.shelter_members on shelter_members.shelter_id = pets.shelter_id
      where pets.id = pet_internal.pet_id
        and shelter_members.user_id = (select auth.uid())
    )
  );

create policy "Members can add enclosures to their shelter"
  on public.pet_internal
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.pets
      join public.shelter_members on shelter_members.shelter_id = pets.shelter_id
      where pets.id = pet_internal.pet_id
        and shelter_members.user_id = (select auth.uid())
    )
  );

create policy "Members can update enclosures of their shelter"
  on public.pet_internal
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.pets
      join public.shelter_members on shelter_members.shelter_id = pets.shelter_id
      where pets.id = pet_internal.pet_id
        and shelter_members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.pets
      join public.shelter_members on shelter_members.shelter_id = pets.shelter_id
      where pets.id = pet_internal.pet_id
        and shelter_members.user_id = (select auth.uid())
    )
  );

create policy "Members can delete enclosures of their shelter"
  on public.pet_internal
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.pets
      join public.shelter_members on shelter_members.shelter_id = pets.shelter_id
      where pets.id = pet_internal.pet_id
        and shelter_members.user_id = (select auth.uid())
    )
  );
