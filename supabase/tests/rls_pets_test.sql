begin;

select plan(27);

select has_table('public', 'pets', 'pets table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Other', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is((select auth.uid()), '11111111-1111-1111-1111-111111111111'::uuid, 'auth.uid returns the test user');

select is(
  (select count(*) from public.volunteers),
  1::bigint,
  'volunteer sees only own volunteer entry'
);

select lives_ok(
  $$
    insert into public.pets (
      name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
    ) values ('Test', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест')
  $$,
  'volunteer can add a pet'
);

select ok(
  public.is_volunteer(),
  'is_volunteer is true for a volunteer'
);

select lives_ok(
  $$ update public.pets set name = 'Renamed' where name = 'Test' $$,
  'volunteer can rename a pet'
);

select is(
  (select count(*) from public.pets where name = 'Renamed'),
  1::bigint,
  'pet was renamed by the volunteer'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select ok(
  not public.is_volunteer(),
  'is_volunteer is false for a logged-in non-volunteer'
);

select throws_ok(
  $$
    insert into public.pets (
      name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
    ) values ('Test2', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест')
  $$,
  '42501',
  'new row violates row-level security policy for table "pets"',
  'logged-in non-volunteer cannot add a pet'
);

update public.pets set name = 'Hacked2' where name = 'Renamed';

select is(
  (select count(*) from public.pets where name = 'Renamed'),
  1::bigint,
  'non-volunteer cannot rename a pet'
);

select throws_ok(
  $$ insert into public.volunteers (user_id) values ('33333333-3333-3333-3333-333333333333') $$,
  '42501',
  'permission denied for table volunteers',
  'logged-in user cannot make himself a volunteer'
);

set local role anon;
set local request.jwt.claims to '{}';

select throws_ok(
  $$
    insert into public.pets (
      name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
    ) values ('Test3', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест')
  $$,
  '42501',
  'permission denied for table pets',
  'guest cannot add a pet'
);

select is(
  (select count(*) from public.pets),
  2::bigint,
  'guest can read pets of the published shelter'
);

select throws_ok(
  $$ update public.pets set name = 'Hacked3' where name = 'Renamed' $$,
  '42501',
  'permission denied for table pets',
  'guest cannot update a pet'
);

select throws_ok(
  $$ delete from public.pets where name = 'Renamed' $$,
  '42501',
  'permission denied for table pets',
  'guest cannot delete a pet'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ delete from public.pets where name = 'Renamed' $$,
  '42501',
  'permission denied for table pets',
  'volunteer cannot delete a pet'
);

update public.pets set status = 'снят с учёта' where name = 'Renamed';

select is(
  (select count(*) from public.pets where status = 'снят с учёта'),
  1::bigint,
  'volunteer can set removed-from-records status'
);

select throws_ok(
  $$ update public.pets set status = 'умер' where name = 'Renamed' $$,
  '23514',
  'new row for relation "pets" violates check constraint "pets_status_check"',
  'unknown status is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$
    insert into public.pets (
      name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
    ) values ('Test4', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест')
  $$,
  '42501',
  'new row violates row-level security policy "Pet inserts require second factor" for table "pets"',
  'volunteer without second factor cannot add a pet'
);

update public.pets set name = 'Hacked4' where name = 'Renamed';

select is(
  (select count(*) from public.pets where name = 'Renamed'),
  1::bigint,
  'volunteer without second factor cannot rename a pet'
);

select is(
  (select count(*) from public.pets),
  2::bigint,
  'volunteer without second factor can still read pets'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select throws_ok(
  $$
    insert into public.pets (
      name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
    ) values ('Test5', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест')
  $$,
  '42501',
  'new row violates row-level security policy "Pet inserts require second factor" for table "pets"',
  'volunteer with no aal claim cannot add a pet'
);

set local role anon;
set local request.jwt.claims to '{}';

select is(
  (select count(*) from public.shelter),
  1::bigint,
  'guest can read the published shelter'
);

select throws_ok(
  $$ insert into public.shelter (id, name) values (true, 'Shelter C') $$,
  '42501',
  'permission denied for table shelter',
  'guest cannot add a shelter row'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelter set about = 'Hacked' $$,
  '42501',
  'permission denied for table shelter',
  'volunteer cannot change the shelter profile'
);

select throws_ok(
  $$ delete from public.shelter $$,
  '42501',
  'permission denied for table shelter',
  'volunteer cannot delete the shelter row'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelter set about = 'Hacked' $$,
  '42501',
  'permission denied for table shelter',
  'non-volunteer cannot change the shelter profile'
);

select * from finish();

rollback;
