begin;

select plan(14);

select has_function('public', 'receive_purchase', array['uuid', 'numeric'], 'receive_purchase exists');

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
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корм для щенков', 'корм', 'кг', 10),
  ('d0000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Корм для кошек', 'корм', 'кг', 5);

set local role anon;

set local request.jwt.claims to '{}';

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$,
  '42501',
  null,
  'anonymous cannot call receive_purchase'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 2)),
  8::numeric,
  'partial purchase leaves the rest of the need'
);

select is(
  (select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 8)),
  0::numeric,
  'exact purchase closes the need'
);

select is(
  (select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 2)),
  -2::numeric,
  'purchase above the need becomes stock'
);

select is(
  (select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 0.5)),
  -2.5::numeric,
  'fractional amounts are supported'
);

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000004', 1) $$,
  'P0002',
  null,
  'member cannot receive items of another shelter'
);

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000004'),
  5::numeric,
  'item of another shelter was not changed'
);

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 0) $$,
  '22023',
  null,
  'zero amount is rejected'
);

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', -1) $$,
  '22023',
  null,
  'negative amount is rejected'
);

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 100001) $$,
  '22023',
  null,
  'too large amount is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$,
  'P0002',
  null,
  'purchase without second factor is rejected'
);

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  -2.5::numeric,
  'item was not changed without second factor'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$,
  'P0002',
  null,
  'user without membership cannot receive'
);

select * from finish();

rollback;