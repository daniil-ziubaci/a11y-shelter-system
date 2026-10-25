begin;

select plan(27);

select has_table('public', 'pets', 'pets table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

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

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

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

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test2', 'кошка', 'мальчик',
      '2024-01-01', false, 4, 'сухой корм', 'здоров', 'тест',
      '/test.jpg', 'тест'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "pets"',
  'logged-in non-member cannot add pet'
);

set local role anon;

set local request.jwt.claims to '{}';

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test3', 'кошка', 'мальчик',
      '2024-01-01', false, 4, 'сухой корм', 'здоров', 'тест',
      '/test.jpg', 'тест'
    )
  $$,
  '42501',
  'permission denied for table pets',
  'guest cannot add pet'
);

select is(
  (select count(*) from public.pets),
  2::bigint,
  'guest can read pets'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$
    insert into public.shelter_members (user_id, shelter_id)
    values (
      '33333333-3333-3333-3333-333333333333',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    )
  $$,
  '42501',
  'permission denied for table shelter_members',
  'logged-in user cannot make himself a member'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

update public.pets
set name = 'Renamed'
where name = 'Test';

select is(
  (select count(*) from public.pets where name = 'Renamed'),
  1::bigint,
  'member can rename pet of own shelter'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

update public.pets
set name = 'Hacked2'
where name = 'Renamed';

select is(
  (select count(*) from public.pets where name = 'Renamed'),
  1::bigint,
  'non-member cannot rename pet'
);

set local role anon;

set local request.jwt.claims to '{}';

select throws_ok(
  $$
    update public.pets
    set name = 'Hacked3'
    where name = 'Renamed'
  $$,
  '42501',
  'permission denied for table pets',
  'guest cannot update pet'
);

select throws_ok(
  $$
    delete from public.pets
    where name = 'Renamed'
  $$,
  '42501',
  'permission denied for table pets',
  'guest cannot delete pet'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$
    delete from public.pets
    where name = 'Renamed'
  $$,
  '42501',
  'permission denied for table pets',
  'member cannot delete pet'
);

update public.pets
set status = 'снят с учёта'
where name = 'Renamed';

select is(
  (select count(*) from public.pets where status = 'снят с учёта'),
  1::bigint,
  'member can set removed-from-records status'
);

select throws_ok(
  $$
    update public.pets
    set status = 'умер'
    where name = 'Renamed'
  $$,
  '23514',
  'new row for relation "pets" violates check constraint "pets_status_check"',
  'unknown status is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test4', 'кошка', 'мальчик',
      '2024-01-01', false, 4, 'сухой корм', 'здоров', 'тест',
      '/test.jpg', 'тест'
    )
  $$,
  '42501',
  'new row violates row-level security policy "Pet inserts require second factor" for table "pets"',
  'member without second factor cannot add pet'
);

update public.pets
set name = 'Hacked4'
where name = 'Renamed';

select is(
  (select count(*) from public.pets where name = 'Renamed'),
  1::bigint,
  'member without second factor cannot rename pet'
);

select is(
  (select count(*) from public.pets),
  2::bigint,
  'member without second factor can still read pets'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$
    insert into public.pets (
      shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test5', 'кошка', 'мальчик',
      '2024-01-01', false, 4, 'сухой корм', 'здоров', 'тест',
      '/test.jpg', 'тест'
    )
  $$,
  '42501',
  'new row violates row-level security policy "Pet inserts require second factor" for table "pets"',
  'member with no aal claim cannot add pet'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select count(*) from public.shelters),
  2::bigint,
  'guest can read shelters'
);

select throws_ok(
  $$
    insert into public.shelters (slug, name, currency)
    values ('shelter-c', 'Shelter C', 'MDL')
  $$,
  '42501',
  'permission denied for table shelters',
  'guest cannot add shelter'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$
    insert into public.shelters (slug, name, currency)
    values ('shelter-d', 'Shelter D', 'MDL')
  $$,
  '42501',
  'permission denied for table shelters',
  'member cannot add shelter'
);

select throws_ok(
  $$
    update public.shelters
    set about = 'Hacked'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  '42501',
  'permission denied for table shelters',
  'member cannot change shelter profile'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$
    update public.shelters
    set about = 'Hacked'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  $$,
  '42501',
  'permission denied for table shelters',
  'non-member cannot change shelter profile'
);

select * from finish();

rollback;