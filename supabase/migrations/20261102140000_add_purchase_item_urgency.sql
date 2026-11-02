alter table public.purchase_items
  add column is_urgent boolean not null default false,
  add column urgent_since timestamptz;

create function public.purchase_items_set_urgent_since()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_urgent then
    if tg_op = 'UPDATE' and old.is_urgent then
      new.urgent_since := old.urgent_since;
    else
      new.urgent_since := now();
    end if;
  else
    new.urgent_since := null;
  end if;
  return new;
end;
$$;

revoke all on function public.purchase_items_set_urgent_since() from public, anon, authenticated;

create trigger purchase_items_set_urgent_since
before insert or update on public.purchase_items
for each row
execute function public.purchase_items_set_urgent_since();

alter table public.purchase_items
  add constraint purchase_items_urgent_since_check
  check (
    (is_urgent and urgent_since is not null)
    or (not is_urgent and urgent_since is null)
  );

grant update (is_urgent) on public.purchase_items to authenticated;
