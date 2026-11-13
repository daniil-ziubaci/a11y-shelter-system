begin;

select plan(13);

select has_column('public', 'pets', 'size', 'size column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size
) values
  ('c0000000-0000-0000-0000-000000000001', 'Dog A', 'собака', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'средняя'),
  ('c0000000-0000-0000-0000-000000000002', 'Cat A', 'кошка', 'девочка', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', null),
  ('c0000000-0000-0000-0000-000000000003', 'Dog B', 'собака', 'девочка', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'мелкая');

select lives_ok(
  $$
    insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size)
    values ('Dog C', 'собака', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'крупная')
  $$,
  'dog with a valid size is accepted'
);

select throws_ok(
  $$
    insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt)
    values ('Dog D', 'собака', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест')
  $$,
  '23514', null, 'dog without a size is rejected'
);

select throws_ok(
  $$
    insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size)
    values ('Cat B', 'кошка', 'девочка', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'мелкая')
  $$,
  '23514', null, 'cat with a size is rejected'
);

select throws_ok(
  $$
    insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size)
    values ('Dog E', 'собака', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'огромная')
  $$,
  '23514', null, 'unknown size is rejected'
);

set local role anon;
set local request.jwt.claims to '{}';

select is(
  (select size from public.pets where id = 'c0000000-0000-0000-0000-000000000001'),
  'средняя',
  'anonymous can read size'
);

select throws_ok(
  $$ update public.pets set size = 'крупная' where id = 'c0000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'anonymous cannot update size'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ update public.pets set size = 'крупная' where id = 'c0000000-0000-0000-0000-000000000001' $$,
  'volunteer can change the size of a dog'
);

select is(
  (select size from public.pets where id = 'c0000000-0000-0000-0000-000000000001'),
  'крупная',
  'dog size was changed'
);

select throws_ok(
  $$ update public.pets set size = 'мелкая' where id = 'c0000000-0000-0000-0000-000000000002' $$,
  '23514', null, 'volunteer cannot give a size to a cat'
);

select throws_ok(
  $$ update public.pets set size = null where id = 'c0000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'volunteer cannot clear the size of a dog'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select lives_ok(
  $$ update public.pets set size = 'крупная' where id = 'c0000000-0000-0000-0000-000000000003' $$,
  'update by a non-volunteer raises no error'
);

select is(
  (select size from public.pets where id = 'c0000000-0000-0000-0000-000000000003'),
  'мелкая',
  'size was not changed by a non-volunteer'
);

select * from finish();

rollback;
