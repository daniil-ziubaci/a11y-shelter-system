begin;

select plan(3);

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

select col_is_null('public', 'pets', 'diet', 'diet может быть пустым');

select lives_ok(
  $$insert into public.pets (
    id, shelter_id, name, species, sex, birth_date, is_age_approximate,
    health, description, photo_url, photo_alt
  ) values (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Diet', 'кошка', 'мальчик', '2024-01-01', false,
    'здоров', 'тест', '/test.jpg', 'тест'
  )$$,
  'животное создаётся без diet'
);

select is(
  (select diet from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null,
  'diet у такого животного пустой'
);

select * from finish();

rollback;