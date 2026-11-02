-- После отката колонки progress_total, progress_done и progress_unit удаляются вместе с данными: счёт дел по проектам (сколько всего, сколько сделано, что считаем) теряется без возможности восстановления. Ограничение и права на колонки удаляются вместе с ними. Остальные данные проектов не затрагиваются.
alter table public.projects
  drop column progress_total,
  drop column progress_done,
  drop column progress_unit;
