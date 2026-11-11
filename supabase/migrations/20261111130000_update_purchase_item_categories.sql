alter table public.purchase_items
  drop constraint purchase_items_category_check;

update public.purchase_items
  set category = 'гигиена'
  where category = 'дезинфекция';

alter table public.purchase_items
  add constraint purchase_items_category_check
  check (category = any (array[
    'корм',
    'лекарства',
    'расходники',
    'гигиена',
    'амуниция',
    'инвентарь',
    'территория',
    'рабочим'
  ]));
