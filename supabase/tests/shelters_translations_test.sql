begin;

select plan(10);

select has_column('public', 'shelters', 'translations', 'shelters has translations column');

select col_type_is('public', 'shelters', 'translations', 'jsonb', 'translations is jsonb');

select col_not_null('public', 'shelters', 'translations', 'translations is not null');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select is(
  (select translations from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '{}'::jsonb,
  'new shelter starts with empty translations'
);

select throws_ok(
  $$ update public.shelters set translations = '[]'::jsonb where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '23514',
  null,
  'array is rejected'
);

select throws_ok(
  $$ update public.shelters set translations = jsonb_build_object('x', repeat('a', 20001)) where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '23514',
  null,
  'oversized value is rejected'
);

select throws_ok(
  $$ update public.shelters set translations = null where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '23502',
  null,
  'null is rejected'
);

select lives_ok(
  $$ update public.shelters set translations = '{"about": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'valid object is accepted'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set translations = '{"hacked": {}}'::jsonb where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  '42501',
  null,
  'member cannot write translations'
);

reset role;

set local role anon;

select lives_ok(
  $$ select translations from public.shelters $$,
  'anon can read translations'
);

reset role;

select * from finish();

rollback;
