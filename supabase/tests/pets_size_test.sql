begin;

select plan(12);

select has_column('public', 'pets', 'size', 'size column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size
) values
  ('c0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Dog A', 'собака', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'средняя'),
  ('c0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Cat A', 'кошка', 'девочка', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', null),
  ('c0000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Dog B', 'собака', 'девочка', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'мелкая');

select lives_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dog C', 'собака', 'мальчик',
      '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'крупная'
    )
  $$,
  'dog with a valid size is accepted'
);

select lives_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dog D', 'собака', 'мальчик',
      '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
    )
  $$,
  'dog without a size is accepted for now'
);

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cat B', 'кошка', 'девочка',
      '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'мелкая'
    )
  $$,
  '23514',
  null,
  'cat with a size is rejected'
);

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, size
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dog E', 'собака', 'мальчик',
      '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест', 'огромная'
    )
  $$,
  '23514',
  null,
  'unknown size is rejected'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select size from public.pets where id = 'c0000000-0000-0000-0000-000000000001'),
  'средняя',
  'anonymous can read size'
);

select throws_ok(
  $$
    update public.pets set size = 'крупная'
    where id = 'c0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'anonymous cannot update size'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    update public.pets set size = 'крупная'
    where id = 'c0000000-0000-0000-0000-000000000001'
  $$,
  'member can change size of own dog'
);

select is(
  (select size from public.pets where id = 'c0000000-0000-0000-0000-000000000001'),
  'крупная',
  'own dog size was changed'
);

select lives_ok(
  $$
    update public.pets set size = 'крупная'
    where id = 'c0000000-0000-0000-0000-000000000003'
  $$,
  'update of a dog of another shelter raises no error'
);

select is(
  (select size from public.pets where id = 'c0000000-0000-0000-0000-000000000003'),
  'мелкая',
  'size of a dog of another shelter was not changed'
);

select throws_ok(
  $$
    update public.pets set size = 'мелкая'
    where id = 'c0000000-0000-0000-0000-000000000002'
  $$,
  '23514',
  null,
  'member cannot give a size to a cat'
);

select * from finish();

rollback;