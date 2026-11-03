begin;

select plan(13);

select has_column('public', 'pets', 'translations', 'pets has translations column');

select col_type_is('public', 'pets', 'translations', 'jsonb', 'translations is jsonb');

select col_not_null('public', 'pets', 'translations', 'translations is not null');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Other', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест'
);

select is(
  (select translations from public.pets where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{}'::jsonb,
  'new pet starts with empty translations'
);

select throws_ok(
  $$ update public.pets set translations = '[]'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23514',
  null,
  'array is rejected'
);

select throws_ok(
  $$ update public.pets set translations = jsonb_build_object('x', repeat('a', 20001)) where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23514',
  null,
  'oversized value is rejected'
);

select throws_ok(
  $$ update public.pets set translations = null where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23502',
  null,
  'null is rejected'
);

select lives_ok(
  $$ update public.pets set translations = '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'valid object is accepted'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into public.pets (
      id, shelter_id, name, species, sex, birth_date, is_age_approximate,
      weight, diet, health, description, photo_url, photo_alt, translations
    ) values (
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Test', 'кошка', 'мальчик', '2024-01-01', false, 4,
      'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест',
      '{"description": {"en": {"text": "Hi", "hash": "x"}}}'::jsonb
    )
  $$,
  'member inserts own pet with translations'
);

select lives_ok(
  $$ update public.pets set translations = '{"description": {"ro": {"text": "Salut", "hash": "def"}}}'::jsonb where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'member updates translations of own pet'
);

select is(
  (select translations #>> '{description,ro,text}' from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Salut',
  'member reads own translation'
);

select lives_ok(
  $$ update public.pets set translations = '{"hacked": {}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'update of another shelter pet runs without error'
);

reset role;

select is(
  (select translations from public.pets where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb,
  'translations of another shelter pet are unchanged'
);

select * from finish();

rollback;
