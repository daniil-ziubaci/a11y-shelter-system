create function public.record_consumption(p_item_id uuid, p_amount numeric)
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
  set remaining = i.remaining + p_amount
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

revoke all on function public.record_consumption(uuid, numeric) from public, anon, authenticated;
grant execute on function public.record_consumption(uuid, numeric) to authenticated;
