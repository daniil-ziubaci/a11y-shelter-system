alter table public.purchase_log
  alter column created_at set default clock_timestamp();

create function public.undo_purchase(p_log_id uuid)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_log public.purchase_log;
  v_latest uuid;
  v_remaining numeric;
begin
  select l.* into v_log
  from public.purchase_log as l
  where l.id = p_log_id
    and (select auth.jwt()->>'aal') = 'aal2'
    and exists (
      select 1
      from public.shelter_members as m
      where m.user_id = (select auth.uid())
        and m.shelter_id = l.shelter_id
    )
  for update;

  if not found then
    raise exception 'log entry not found' using errcode = 'P0002';
  end if;

  select l.id into v_latest
  from public.purchase_log as l
  where l.shelter_id = v_log.shelter_id
  order by l.created_at desc, l.id desc
  limit 1;

  if v_latest <> p_log_id or v_log.created_at < now() - interval '10 minutes' then
    raise exception 'log entry is not the latest or too old' using errcode = 'P0001';
  end if;

  update public.purchase_items as i
  set remaining = i.remaining + v_log.amount
  where i.id = v_log.item_id
  returning i.remaining into v_remaining;

  delete from public.purchase_log where id = p_log_id;

  return v_remaining;
end;
$$;

revoke all on function public.undo_purchase(uuid) from public, anon, authenticated;
grant execute on function public.undo_purchase(uuid) to authenticated;