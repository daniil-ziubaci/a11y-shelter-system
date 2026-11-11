-- Откат: возвращает прежние пять категорий.
-- Внимание: позиции в новых категориях (амуниция, инвентарь, территория, рабочим)
-- переводятся в «расходники», прежнюю категорию восстановить нельзя.
-- Позиции, которые были в «дезинфекции», остаются в «гигиене».
alter table public.purchase_items
  drop constraint if exists purchase_items_category_check;

update public.purchase_items
  set category = 'расходники'
  where category in ('амуниция', 'инвентарь', 'территория', 'рабочим');

alter table public.purchase_items
  add constraint purchase_items_category_check
  check (category = any (array[
    'корм',
    'лекарства',
    'гигиена',
    'дезинфекция',
    'расходники'
  ]));
