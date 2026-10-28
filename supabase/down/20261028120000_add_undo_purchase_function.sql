-- После отката функция отмены покупки удаляется, а время записей журнала снова заполняется через now(). Уже отменённые покупки не восстанавливаются.
drop function public.undo_purchase(uuid);

alter table public.purchase_log
  alter column created_at set default now();