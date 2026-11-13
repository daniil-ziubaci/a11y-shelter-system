begin;

select plan(24);

select has_table('public', 'pet_internal', 'pet_internal exists');
select hasnt_column('public', 'pets', 'enclosure', 'pets has no enclosure column');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   'Pet A', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест');

set local role anon;

select throws_ok(
  $$ select * from public.pet_internal $$,
  '42501',
  null,
  'anon cannot read enclosures'
);

select throws_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 1') $$,
  '42501',
  null,
  'anon cannot add enclosures'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 3') $$,
  'volunteer adds an enclosure'
);

select is(
  (select count(*) from public.pet_internal),
  1::bigint,
  'volunteer sees the enclosure'
);

select throws_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Вольер 9') $$,
  '23503',
  null,
  'enclosure of an unknown pet is rejected'
);

select lives_ok(
  $$ update public.pet_internal set enclosure = 'Вольер 4' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'volunteer updates the enclosure'
);

select is(
  (select enclosure from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Вольер 4',
  'the enclosure changed'
);

select throws_ok(
  $$ update public.pet_internal set enclosure = '' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  '23514',
  null,
  'empty enclosure is rejected'
);

select throws_ok(
  $$ update public.pet_internal set enclosure = ' Вольер' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  '23514',
  null,
  'enclosure with spaces at the edges is rejected'
);

select throws_ok(
  $$ update public.pet_internal set enclosure = repeat('а', 41) where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  '23514',
  null,
  'enclosure longer than 40 characters is rejected'
);

select throws_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 5') $$,
  '23505',
  null,
  'a pet has at most one enclosure'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is(
  (select count(*) from public.pet_internal),
  0::bigint,
  'logged-in non-volunteer sees no enclosures'
);

select lives_ok(
  $$ update public.pet_internal set enclosure = 'Взлом' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'update by a non-volunteer runs without error'
);

select lives_ok(
  $$ delete from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'delete by a non-volunteer runs without error'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select lives_ok(
  $$ update public.pet_internal set enclosure = 'Без фактора' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'update without second factor runs without error'
);

select lives_ok(
  $$ delete from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'delete without second factor runs without error'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select enclosure from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Вольер 4',
  'non-volunteer and missing second factor changed and deleted nothing'
);

select lives_ok(
  $$ delete from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'volunteer deletes the enclosure'
);

select is(
  (select count(*) from public.pet_internal),
  0::bigint,
  'the enclosure is gone'
);

select lives_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 5') $$,
  'volunteer adds the enclosure again'
);

reset role;

select lives_ok(
  $$ delete from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'pet is deleted'
);

select is(
  (select count(*) from public.pet_internal),
  0::bigint,
  'deleting the pet deletes its enclosure'
);

select * from finish();

rollback;
