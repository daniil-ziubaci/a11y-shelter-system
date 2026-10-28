-- После отката функция receive_purchase возвращается к прежней версии (security invoker, без записи в журнал), а таблица purchase_log удаляется вместе с индексом и политикой. Вся история закупок теряется без возможности восстановления; перед откатом на проде сделать выгрузку.
create or replace function public.receive_purchase(p_item_id uuid, p_amount numeric)
returns numeric
language plpgsql
set search_path = ''
as $$
declare
  v_remaining numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100000 then
    raise exception 'invalid amount' using errcode = '22023';
  end if;

  update public.purchase_items
  set remaining = remaining - p_amount
  where id = p_item_id
  returning remaining into v_remaining;

  if not found then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  return v_remaining;
end;
$$;

revoke all on function public.receive_purchase(uuid, numeric) from public, anon, authenticated;
grant execute on function public.receive_purchase(uuid, numeric) to authenticated;

drop table public.purchase_log;