begin;

select plan(7);

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, status
) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'ищет дом'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'в процессе'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'C', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'на лечении'),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'D', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'пристроен'),
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'E', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'снят с учёта');

select has_column('public', 'pets', 'status_rank', 'колонка status_rank есть');

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'pets'
      and indexname = 'pets_catalog_order_idx'
  ),
  'индекс порядка каталога есть'
);

select is(
  (select array_agg(status_rank order by name) from public.pets
    where shelter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  array[0, 1, 2, 3, 3]::smallint[],
  'ранги: ищет дом 0, в процессе 1, на лечении 2, остальные 3'
);

update public.pets
  set status = 'на лечении'
  where id = '11111111-1111-1111-1111-111111111111';

select is(
  (select status_rank from public.pets where id = '11111111-1111-1111-1111-111111111111'),
  2::smallint,
  'после смены статуса ранг пересчитывается сам'
);

select throws_ok(
  $$update public.pets set status_rank = 0 where id = '11111111-1111-1111-1111-111111111111'$$,
  '428C9',
  null,
  'status_rank нельзя записать напрямую'
);

select ok(
  has_column_privilege('anon', 'public.pets', 'status_rank', 'select'),
  'гость читает status_rank'
);

select ok(
  has_column_privilege('authenticated', 'public.pets', 'status_rank', 'select'),
  'волонтёр читает status_rank'
);

select * from finish();

rollback;
