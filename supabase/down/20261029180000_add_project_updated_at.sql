-- Откат: убирает триггер, функцию и колонку updated_at.
-- Данные в колонке теряются безвозвратно (дата последнего изменения проектов).
drop trigger projects_set_updated_at on public.projects;
drop function public.projects_set_updated_at();
alter table public.projects drop column updated_at;