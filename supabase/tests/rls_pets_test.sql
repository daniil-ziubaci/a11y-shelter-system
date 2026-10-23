begin;

select plan(7);

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

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Other', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест'
);

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

select throws_ok(
  $$
    update public.pets
    set shelter_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where name = 'Test'
  $$,
  '42501',
  'new row violates row-level security policy for table "pets"',
  'member cannot move pet to other shelter'
);

update public.pets
set name = 'Hacked'
where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select is(
  (select name from public.pets where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'Other',
  'member cannot rename pet of other shelter'
);

select * from finish();

rollback;