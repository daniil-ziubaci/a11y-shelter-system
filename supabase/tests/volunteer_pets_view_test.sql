begin;

select plan(7);

select has_view('public', 'volunteer_pets', 'volunteer_pets exists');

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
) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Pet A', 'кошка', 'мальчик', '2024-01-01', false, 4,
   'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Pet B', 'кошка', 'мальчик', '2024-01-01', false, 4,
   'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест');

insert into public.pet_internal (pet_id, enclosure) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 3'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Вольер 7');

set local role anon;

select throws_ok(
  $$ select * from public.volunteer_pets $$,
  '42501',
  null,
  'anon cannot read the view'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select enclosure from public.volunteer_pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Вольер 3',
  'member sees the enclosure of a pet of their shelter'
);

select ok(
  (select search_text ilike '% вольер 3' from public.volunteer_pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'search text is the name followed by the enclosure'
);

select is(
  (select enclosure from public.volunteer_pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  null,
  'member does not see the enclosure of another shelter'
);

select ok(
  (select search_text not ilike '%вольер%' from public.volunteer_pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'search text of another shelter has no enclosure'
);

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "aal": "aal2"}';

select is(
  (select enclosure from public.volunteer_pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'Вольер 7',
  'member of the other shelter sees their own enclosure'
);

select * from finish();

rollback;
