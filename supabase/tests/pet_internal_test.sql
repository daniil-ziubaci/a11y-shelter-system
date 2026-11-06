begin;

select plan(22);

select has_table('public', 'pet_internal', 'pet_internal exists');
select hasnt_column('public', 'pets', 'enclosure', 'pets has no enclosure column');

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
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Pet A', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Pet B', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест');

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
  'member adds an enclosure to a pet of their shelter'
);

select is(
  (select count(*) from public.pet_internal),
  1::bigint,
  'member sees the enclosure'
);

select throws_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Вольер 9') $$,
  '42501',
  null,
  'member cannot add an enclosure to a pet of another shelter'
);

select lives_ok(
  $$ update public.pet_internal set enclosure = 'Вольер 4' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'member updates the enclosure'
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

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "aal": "aal2"}';

select is(
  (select count(*) from public.pet_internal),
  0::bigint,
  'member of another shelter sees no enclosures'
);

select lives_ok(
  $$ update public.pet_internal set enclosure = 'Взлом' where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'update by another shelter runs without error'
);

select lives_ok(
  $$ delete from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'delete by another shelter runs without error'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select enclosure from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Вольер 4',
  'another shelter changed and deleted nothing'
);

select lives_ok(
  $$ delete from public.pet_internal where pet_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'member deletes the enclosure'
);

select is(
  (select count(*) from public.pet_internal),
  0::bigint,
  'the enclosure is gone'
);

select lives_ok(
  $$ insert into public.pet_internal (pet_id, enclosure) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 5') $$,
  'member adds the enclosure again'
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
