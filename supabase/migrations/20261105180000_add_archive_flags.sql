alter table public.purchase_items
  add column is_archived boolean not null default false,
  add constraint purchase_items_archived_only_when_closed
    check (not is_archived or remaining = 0);

grant update (is_archived) on public.purchase_items to authenticated;

alter table public.projects
  add column is_archived boolean not null default false;

grant update (is_archived) on public.projects to authenticated;

drop policy "Anyone can read projects" on public.projects;

create policy "Anyone can read active projects"
  on public.projects
  for select
  to anon, authenticated
  using (not is_archived);

create policy "Members can read all projects of their shelter"
  on public.projects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = projects.shelter_id
    )
  );

create or replace function public.record_consumption(p_item_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100000 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  update public.purchase_items as i
  set remaining = i.remaining + p_amount,
      is_archived = false
  where i.id = p_item_id
    and (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.shelter_members as m
      where m.user_id = (select auth.uid())
        and m.shelter_id = i.shelter_id
    )
  returning i.remaining into v_remaining;

  if not found then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  return v_remaining;
end;
$$;
