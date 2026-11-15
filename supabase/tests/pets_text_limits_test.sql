begin;

select plan(12);

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Рекс', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);

select throws_ok(
  $$ update public.pets set name = '' $$,
  '23514', null, 'empty name is rejected'
);
select throws_ok(
  $$ update public.pets set name = repeat('а', 51) $$,
  '23514', null, 'name of 51 characters is rejected'
);
select lives_ok(
  $$ update public.pets set name = repeat('а', 50) $$,
  'name of 50 characters is accepted'
);
select throws_ok(
  $$ update public.pets set name = ' Рекс' $$,
  '23514', null, 'name with a leading space is rejected'
);
select throws_ok(
  $$ update public.pets set photo_alt = repeat('а', 301) $$,
  '23514', null, 'photo description of 301 characters is rejected'
);
select lives_ok(
  $$ update public.pets set photo_alt = repeat('а', 300) $$,
  'photo description of 300 characters is accepted'
);
select throws_ok(
  $$ update public.pets set health = repeat('а', 501) $$,
  '23514', null, 'health of 501 characters is rejected'
);
select lives_ok(
  $$ update public.pets set health = repeat('а', 500) $$,
  'health of 500 characters is accepted'
);
select throws_ok(
  $$ update public.pets set health = E'здоров\n' $$,
  '23514', null, 'health ending with a line break is rejected'
);
select throws_ok(
  $$ update public.pets set description = repeat('а', 3001) $$,
  '23514', null, 'description of 3001 characters is rejected'
);
select lives_ok(
  $$ update public.pets set description = repeat('а', 3000) $$,
  'description of 3000 characters is accepted'
);
select lives_ok(
  $$ update public.pets set description = E'Первая строка.\n\nВторая строка.' $$,
  'description with line breaks inside is accepted'
);

select * from finish();

rollback;
