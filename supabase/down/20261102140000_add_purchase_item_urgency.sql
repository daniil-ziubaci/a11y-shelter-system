-- Откат: убирает право на is_urgent, ограничение, триггер, функцию и обе колонки.
-- Отметки срочности и даты их включения теряются безвозвратно.
revoke update (is_urgent) on public.purchase_items from authenticated;
alter table public.purchase_items drop constraint purchase_items_urgent_since_check;
drop trigger purchase_items_set_urgent_since on public.purchase_items;
drop function public.purchase_items_set_urgent_since();
alter table public.purchase_items drop column urgent_since;
alter table public.purchase_items drop column is_urgent;
