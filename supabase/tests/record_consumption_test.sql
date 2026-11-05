begin;

select plan(14);

select has_function('public', 'record_consumption', array['uuid', 'numeric'], 'record_consumption exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корм для щенков', 'корм', 'кг', -13),
  ('d0000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Корм для кошек', 'корм', 'кг', 5);

set local role anon;

set local request.jwt.claims to '{}';

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', 1) $$,
  '42501',
  null,
  'anonymous cannot call record_consumption'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000001', 5)),
  -8::numeric,
  'consumption below the stock reduces the stock'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000001', 8)),
  0::numeric,
  'consumption equal to the stock leaves nothing'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000001', 7)),
  7::numeric,
  'consumption above the stock becomes a need'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000001', 0.5)),
  7.5::numeric,
  'fractional amounts are supported'
);

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000004', 1) $$,
  'P0002',
  null,
  'member cannot change items of another shelter'
);

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000004'),
  5::numeric,
  'item of another shelter was not changed'
);

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', 0) $$,
  '22023',
  null,
  'zero amount is rejected'
);

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', -1) $$,
  '22023',
  null,
  'negative amount is rejected'
);

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', 100001) $$,
  '22023',
  null,
  'too large amount is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', 1) $$,
  'P0002',
  null,
  'consumption without second factor is rejected'
);

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  7.5::numeric,
  'item was not changed without second factor'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', 1) $$,
  'P0002',
  null,
  'user without membership cannot record consumption'
);

select * from finish();

rollback;
