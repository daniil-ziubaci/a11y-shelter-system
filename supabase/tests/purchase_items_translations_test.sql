begin;

select plan(13);

select has_column('public', 'purchase_items', 'translations', 'purchase_items has translations column');

select col_type_is('public', 'purchase_items', 'translations', 'jsonb', 'translations is jsonb');

select col_not_null('public', 'purchase_items', 'translations', 'translations is not null');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Корм для кошек', 'корм', 'кг', 5);

select is(
  (select translations from public.purchase_items where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{}'::jsonb,
  'new item starts with empty translations'
);

select throws_ok(
  $$ update public.purchase_items set translations = '[]'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23514',
  null,
  'array is rejected'
);

select throws_ok(
  $$ update public.purchase_items set translations = jsonb_build_object('x', repeat('a', 20001)) where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23514',
  null,
  'oversized value is rejected'
);

select throws_ok(
  $$ update public.purchase_items set translations = null where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '23502',
  null,
  'null is rejected'
);

select lives_ok(
  $$ update public.purchase_items set translations = '{"name": {"en": {"text": "Cat food", "hash": "abc"}}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'valid object is accepted'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into public.purchase_items (id, shelter_id, name, category, unit, remaining) values (
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Корм для щенков', 'корм', 'кг', 10
    )
  $$,
  'member inserts own item'
);

select lives_ok(
  $$ update public.purchase_items set translations = '{"name": {"ro": {"text": "Hrană pentru căței", "hash": "def"}}}'::jsonb where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' $$,
  'member updates translations of own item'
);

select is(
  (select translations #>> '{name,ro,text}' from public.purchase_items where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'Hrană pentru căței',
  'member reads own translation'
);

select lives_ok(
  $$ update public.purchase_items set translations = '{"hacked": {}}'::jsonb where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  'update of another shelter item runs without error'
);

reset role;

select is(
  (select translations from public.purchase_items where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  '{"name": {"en": {"text": "Cat food", "hash": "abc"}}}'::jsonb,
  'translations of another shelter item are unchanged'
);

select * from finish();

rollback;
