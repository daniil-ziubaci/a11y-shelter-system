-- Откат: убирает триггер, функцию и колонку status_changed_at.
-- Данные в колонке теряются безвозвратно (дата последнего сохранения статуса).
drop trigger pets_set_status_changed_at on public.pets;
drop function public.pets_set_status_changed_at();
alter table public.pets drop column status_changed_at;