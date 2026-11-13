begin;

select plan(7);

select has_view('public', 'volunteer_pets', 'volunteer_pets exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Pet A', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Pet B', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест');

insert into public.pet_internal (pet_id, enclosure) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Вольер 3');

set local role anon;

select throws_ok($$ select * from public.volunteer_pets $$, '42501', null, 'anon cannot read the view');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select enclosure from public.volunteer_pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Вольер 3',
  'volunteer sees the enclosure'
);

select ok(
  (select search_text ilike '% вольер 3' from public.volunteer_pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'search text is the name followed by the enclosure'
);

select is(
  (select enclosure from public.volunteer_pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  null,
  'pet without an enclosure has none in the view'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is(
  (select enclosure from public.volunteer_pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null,
  'non-volunteer does not see the enclosure'
);

select ok(
  (select search_text not ilike '%вольер%' from public.volunteer_pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'search text of a non-volunteer has no enclosure'
);

select * from finish();

rollback;
