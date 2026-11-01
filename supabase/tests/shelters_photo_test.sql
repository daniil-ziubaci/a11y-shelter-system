begin;

select plan(9);

select has_column('public', 'shelters', 'photo_path', 'photo_path column exists');

select has_column('public', 'shelters', 'photo_alt', 'photo_alt column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, currency, photo_path, photo_alt) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/shelter/photo.webp', 'Двор приюта с вольерами');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.shelters (slug, name, currency) values ('shelter-b', 'Shelter B', 'MDL') $$,
  'shelter without photo is accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, currency, photo_path) values ('shelter-c', 'Shelter C', 'MDL', 'c/shelter/photo.webp') $$,
  '23514',
  null,
  'photo path without description is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, currency, photo_path, photo_alt) values ('shelter-d', 'Shelter D', 'MDL', 'd/shelter/photo.webp', '') $$,
  '23514',
  null,
  'empty description is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, currency, photo_path, photo_alt) values ('shelter-e', 'Shelter E', 'MDL', 'e/shelter/photo.webp', repeat('а', 301)) $$,
  '23514',
  null,
  'description of 301 characters is rejected'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select photo_alt from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Двор приюта с вольерами',
  'anonymous can read photo_alt'
);

select throws_ok(
  $$ update public.shelters set photo_alt = 'Взлом' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set photo_alt = 'Взлом' $$,
  '42501',
  null,
  'volunteer cannot update photo_alt'
);

select * from finish();
