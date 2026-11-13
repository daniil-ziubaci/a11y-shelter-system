begin;

select plan(39);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Other', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);
insert into public.projects (id, title, description) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Other', 'тест');
insert into public.purchase_items (id, name, category, unit, remaining) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Корм для кошек', 'корм', 'кг', 5);

select has_column('public', 'pets', 'translations', 'pets has translations column');
select col_type_is('public', 'pets', 'translations', 'jsonb', 'pets.translations is jsonb');
select col_not_null('public', 'pets', 'translations', 'pets.translations is not null');
select has_column('public', 'projects', 'translations', 'projects has translations column');
select col_type_is('public', 'projects', 'translations', 'jsonb', 'projects.translations is jsonb');
select col_not_null('public', 'projects', 'translations', 'projects.translations is not null');
select has_column('public', 'purchase_items', 'translations', 'purchase_items has translations column');
select col_type_is('public', 'purchase_items', 'translations', 'jsonb', 'purchase_items.translations is jsonb');
select col_not_null('public', 'purchase_items', 'translations', 'purchase_items.translations is not null');

select is((select translations from public.pets), '{}'::jsonb, 'new pet starts with empty translations');
select is((select translations from public.projects), '{}'::jsonb, 'new project starts with empty translations');
select is((select translations from public.purchase_items), '{}'::jsonb, 'new item starts with empty translations');

select throws_ok($$ update public.pets set translations = '[]'::jsonb $$, '23514', null, 'pets: array is rejected');
select throws_ok($$ update public.projects set translations = '[]'::jsonb $$, '23514', null, 'projects: array is rejected');
select throws_ok($$ update public.purchase_items set translations = '[]'::jsonb $$, '23514', null, 'items: array is rejected');

select throws_ok(
  $$ update public.pets set translations = jsonb_build_object('x', repeat('a', 20001)) $$,
  '23514', null, 'pets: oversized value is rejected'
);
select throws_ok(
  $$ update public.projects set translations = jsonb_build_object('x', repeat('a', 20001)) $$,
  '23514', null, 'projects: oversized value is rejected'
);
select throws_ok(
  $$ update public.purchase_items set translations = jsonb_build_object('x', repeat('a', 20001)) $$,
  '23514', null, 'items: oversized value is rejected'
);

select throws_ok($$ update public.pets set translations = null $$, '23502', null, 'pets: null is rejected');
select throws_ok($$ update public.projects set translations = null $$, '23502', null, 'projects: null is rejected');
select throws_ok($$ update public.purchase_items set translations = null $$, '23502', null, 'items: null is rejected');

select lives_ok(
  $$ update public.pets set translations = '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb $$,
  'pets: valid object is accepted'
);
select lives_ok(
  $$ update public.projects set translations = '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb $$,
  'projects: valid object is accepted'
);
select lives_ok(
  $$ update public.purchase_items set translations = '{"name": {"en": {"text": "Cat food", "hash": "abc"}}}'::jsonb $$,
  'items: valid object is accepted'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into public.pets (id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt, translations)
    values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Test', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
      '{"description": {"en": {"text": "Hi", "hash": "x"}}}'::jsonb)
  $$,
  'volunteer inserts a pet with translations'
);

select lives_ok(
  $$ update public.pets set translations = '{"description": {"ro": {"text": "Salut", "hash": "def"}}}'::jsonb where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'volunteer updates translations of a pet'
);

select is(
  (select translations #>> '{description,ro,text}' from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Salut',
  'volunteer reads the pet translation'
);

select lives_ok(
  $$ insert into public.projects (title, description) values ('Test', 'тест') $$,
  'volunteer inserts a project'
);

select lives_ok(
  $$ update public.projects set translations = '{"description": {"ro": {"text": "Salut", "hash": "def"}}}'::jsonb where title = 'Test' $$,
  'volunteer updates translations of a project'
);

select is(
  (select translations #>> '{description,ro,text}' from public.projects where title = 'Test'),
  'Salut',
  'volunteer reads the project translation'
);

select lives_ok(
  $$ insert into public.purchase_items (id, name, category, unit, remaining) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Корм для щенков', 'корм', 'кг', 10) $$,
  'volunteer inserts an item'
);

select lives_ok(
  $$ update public.purchase_items set translations = '{"name": {"ro": {"text": "Hrană pentru căței", "hash": "def"}}}'::jsonb where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'volunteer updates translations of an item'
);

select is(
  (select translations #>> '{name,ro,text}' from public.purchase_items where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Hrană pentru căței',
  'volunteer reads the item translation'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select lives_ok(
  $$ update public.pets set translations = '{"hacked": {}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'pet translation update by a non-volunteer runs without error'
);
select lives_ok(
  $$ update public.projects set translations = '{"hacked": {}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'project translation update by a non-volunteer runs without error'
);
select lives_ok(
  $$ update public.purchase_items set translations = '{"hacked": {}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'item translation update by a non-volunteer runs without error'
);

reset role;

select is(
  (select translations from public.pets where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb,
  'pet translations were not changed by a non-volunteer'
);
select is(
  (select translations from public.projects where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb,
  'project translations were not changed by a non-volunteer'
);
select is(
  (select translations from public.purchase_items where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{"name": {"en": {"text": "Cat food", "hash": "abc"}}}'::jsonb,
  'item translations were not changed by a non-volunteer'
);

select * from finish();

rollback;
