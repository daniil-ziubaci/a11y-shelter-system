alter table public.pets
  drop constraint pets_status_check;

alter table public.pets
  add constraint pets_status_check
  check (status in ('ищет дом', 'в процессе', 'на лечении', 'пристроен', 'снят с учёта'));