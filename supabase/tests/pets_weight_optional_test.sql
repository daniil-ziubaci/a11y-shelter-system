begin;

select plan(4);

select col_is_null('public', 'pets', 'weight', 'weight is optional');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

select lives_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'No weight', 'кошка', 'девочка',
      '2024-01-01', false, 'корм', 'здоров', 'тест', '/test.jpg', 'тест'
    )
  $$,
  'pet without weight is accepted'
);

select lives_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'With weight', 'кошка', 'девочка',
      '2024-01-01', false, 4, 'корм', 'здоров', 'тест', '/test.jpg', 'тест'
    )
  $$,
  'pet with a positive weight is still accepted'
);

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Zero weight', 'кошка', 'девочка',
      '2024-01-01', false, 0, 'корм', 'здоров', 'тест', '/test.jpg', 'тест'
    )
  $$,
  '23514',
  null,
  'zero weight is still rejected'
);

select * from finish();

rollback;