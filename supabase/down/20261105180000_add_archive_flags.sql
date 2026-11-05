-- Откат: возвращает общую политику чтения проектов и удаляет пометку «убрано из списка».
-- Данные: пометки is_archived у позиций и проектов будут потеряны, убранные снова станут видны.
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

drop policy "Members can read all projects of their shelter" on public.projects;
drop policy "Anyone can read active projects" on public.projects;

create policy "Anyone can read projects"
  on public.projects
  for select
  to anon, authenticated
  using (true);

revoke update (is_archived) on public.projects from authenticated;
alter table public.projects drop column is_archived;

revoke update (is_archived) on public.purchase_items from authenticated;
alter table public.purchase_items drop constraint purchase_items_archived_only_when_closed;
alter table public.purchase_items drop column is_archived;
