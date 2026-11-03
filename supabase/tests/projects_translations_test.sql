begin;

select plan(13);

select has_column('public', 'projects', 'translations', 'projects has translations column');

select col_type_is('public', 'projects', 'translations', 'jsonb', 'translations is jsonb');

select col_not_null('public', 'projects', 'translations', 'translations is not null');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.projects (id, shelter_id, title, description) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Other', 'тест');

select is(
  (select translations from public.projects where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{}'::jsonb,
  'new project starts with empty translations'
);

select throws_ok(
  $$ update public.projects set translations = '[]'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23514',
  null,
  'array is rejected'
);

select throws_ok(
  $$ update public.projects set translations = jsonb_build_object('x', repeat('a', 20001)) where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23514',
  null,
  'oversized value is rejected'
);

select throws_ok(
  $$ update public.projects set translations = null where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23502',
  null,
  'null is rejected'
);

select lives_ok(
  $$ update public.projects set translations = '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'valid object is accepted'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into public.projects (shelter_id, title, description) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'тест'
    )
  $$,
  'member inserts own project'
);

select lives_ok(
  $$ update public.projects set translations = '{"description": {"ro": {"text": "Salut", "hash": "def"}}}'::jsonb where title = 'Test' $$,
  'member updates translations of own project'
);

select is(
  (select translations #>> '{description,ro,text}' from public.projects where title = 'Test'),
  'Salut',
  'member reads own translation'
);

select lives_ok(
  $$ update public.projects set translations = '{"hacked": {}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'update of another shelter project runs without error'
);

reset role;

select is(
  (select translations from public.projects where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{"description": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb,
  'translations of another shelter project are unchanged'
);

select * from finish();

rollback;
