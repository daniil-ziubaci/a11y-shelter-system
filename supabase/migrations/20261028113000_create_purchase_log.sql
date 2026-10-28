create table public.purchase_log (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  item_id uuid not null references public.purchase_items (id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index purchase_log_shelter_id_created_at_idx
  on public.purchase_log (shelter_id, created_at desc);

alter table public.purchase_log enable row level security;

revoke all on public.purchase_log from anon, authenticated;

grant select on public.purchase_log to authenticated;

create policy "Members can read purchase log of their shelter"
  on public.purchase_log
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = purchase_log.shelter_id
    )
  );

create or replace function public.receive_purchase(p_item_id uuid, p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shelter_id uuid;
  v_remaining numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100000 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  update public.purchase_items as i
  set remaining = i.remaining - p_amount
  where i.id = p_item_id
    and (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.shelter_members as m
      where m.user_id = (select auth.uid())
        and m.shelter_id = i.shelter_id
    )
  returning i.shelter_id, i.remaining into v_shelter_id, v_remaining;

  if not found then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  insert into public.purchase_log (shelter_id, item_id, amount)
  values (v_shelter_id, p_item_id, p_amount);

  return v_remaining;
end;
$$;

revoke all on function public.receive_purchase(uuid, numeric) from public, anon, authenticated;
grant execute on function public.receive_purchase(uuid, numeric) to authenticated;