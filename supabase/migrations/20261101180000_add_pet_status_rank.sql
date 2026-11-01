alter table public.pets
  add column status_rank smallint generated always as (
    case status
      when 'ищет дом' then 0
      when 'в процессе' then 1
      when 'на лечении' then 2
      else 3
    end
  ) stored;

create index pets_catalog_order_idx
  on public.pets (shelter_id, status_rank, created_at desc, name);
