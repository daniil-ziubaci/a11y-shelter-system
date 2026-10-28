create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  name text not null check (length(btrim(name)) > 0),
  category text not null check (category in ('корм', 'лекарства', 'гигиена', 'дезинфекция', 'расходники')),
  unit text not null check (length(btrim(unit)) > 0),
  remaining numeric not null,
  created_at timestamptz not null default now()
);

create index purchase_items_shelter_id_idx on public.purchase_items (shelter_id);

alter table public.purchase_items enable row level security;

revoke all on public.purchase_items from anon, authenticated;

grant select on public.purchase_items to anon, authenticated;
grant insert, update on public.purchase_items to authenticated;

create policy "Anyone can read open needs"
  on public.purchase_items
  for select
  to anon, authenticated
  using (remaining > 0);

create policy "Members can read all items of their shelter"
  on public.purchase_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = purchase_items.shelter_id
    )
  );

create policy "Members can add items to their shelter"
  on public.purchase_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = purchase_items.shelter_id
    )
  );

create policy "Members can update items of their shelter"
  on public.purchase_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = purchase_items.shelter_id
    )
  )
  with check (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = purchase_items.shelter_id
    )
  );

create policy "Item inserts require second factor"
  on public.purchase_items
  as restrictive
  for insert
  to authenticated
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Item updates require second factor"
  on public.purchase_items
  as restrictive
  for update
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');