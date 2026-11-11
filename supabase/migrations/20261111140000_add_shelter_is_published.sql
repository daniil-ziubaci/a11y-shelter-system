alter table public.shelters
  add column is_published boolean not null default false;

drop policy "Anyone can read shelters" on public.shelters;

create policy "Anonymous can read published shelters"
  on public.shelters
  for select
  to anon
  using (is_published);

create policy "Authenticated can read published or own shelters"
  on public.shelters
  for select
  to authenticated
  using (
    is_published
    or exists (
      select 1
      from public.shelter_members m
      where m.shelter_id = shelters.id
        and m.user_id = (select auth.uid())
    )
  );
