begin;

select plan(5);

select has_table('public', 'pets', 'pets table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is((select auth.uid()), '11111111-1111-1111-1111-111111111111'::uuid, 'auth.uid returns the test user');

select is(
  (select count(*) from public.shelter_members),
  1::bigint,
  'member sees only own membership'
);

select lives_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'кошка', 'мальчик',
      '2024-01-01', false, 4, 'сухой корм', 'здоров', 'тест',
      '/test.jpg', 'тест'
    )
  $$,
  'member can add pet to own shelter'
);

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test', 'кошка', 'мальчик',
      '2024-01-01', false, 4, 'сухой корм', 'здоров', 'тест',
      '/test.jpg', 'тест'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "pets"',
  'member cannot add pet to other shelter'
);

select * from finish();

rollback;