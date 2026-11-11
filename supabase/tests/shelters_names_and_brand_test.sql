begin;

select plan(10);

select has_column('public', 'shelters', 'name_en', 'name_en column exists');
select has_column('public', 'shelters', 'name_ro', 'name_ro column exists');
select has_column('public', 'shelters', 'brand_path', 'brand_path column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, name_en, brand_path) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'Shelter A EN', 'aaaaaaaa/brand/v1');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.shelters (slug, name, name_en, name_ro, brand_path) values ('shelter-b', 'Shelter B', 'Shelter B', 'Adapost B', 'bbbbbbbb/brand/v1') $$,
  'valid names and brand path are accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, name_en) values ('shelter-c', 'Shelter C', '   ') $$,
  '23514',
  null,
  'blank name_en is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, name_ro) values ('shelter-d', 'Shelter D', repeat('a', 151)) $$,
  '23514',
  null,
  'name_ro of 151 characters is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, brand_path) values ('shelter-e', 'Shelter E', '') $$,
  '23514',
  null,
  'empty brand_path is rejected'
);

update public.shelters set is_published = true;

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select name_en from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Shelter A EN',
  'anonymous can read name_en'
);

select throws_ok(
  $$ update public.shelters set name_en = 'Evil' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set brand_path = 'evil/brand' $$,
  '42501',
  null,
  'volunteer cannot update brand_path'
);

select * from finish();
