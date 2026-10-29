-- Откат не сработает, пока в pets есть животные со статусом «на лечении»: старое правило такие строки не допускает. Их статус нужно сначала разобрать вручную, автоматически мы его не подменяем.
alter table public.pets
  drop constraint pets_status_check;

alter table public.pets
  add constraint pets_status_check
  check (status in ('ищет дом', 'в процессе', 'пристроен', 'снят с учёта'));