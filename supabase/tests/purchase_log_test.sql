begin;

select plan(14);

select has_table('public', 'purchase_log', 'purchase_log table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корм для щенков', 'корм', 'кг', 10),
  ('d0000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Корм для кошек', 'корм', 'кг', 5);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 3)),
  7::numeric,
  'purchase of own item succeeds'
);

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 0) $$,
  '22023',
  null,
  'invalid amount is rejected'
);

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000004', 1) $$,
  'P0002',
  null,
  'item of another shelter is rejected'
);

select is(
  (select count(*) from public.purchase_log where item_id = 'd0000000-0000-0000-0000-000000000001'),
  1::bigint,
  'member sees one log row for own item'
);

select is(
  (select amount from public.purchase_log where item_id = 'd0000000-0000-0000-0000-000000000001'),
  3::numeric,
  'log row keeps the purchased amount'
);

select is(
  (select shelter_id from public.purchase_log where item_id = 'd0000000-0000-0000-0000-000000000001'),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'log row belongs to the shelter of the item'
);

select throws_ok(
  $$
    insert into public.purchase_log (shelter_id, item_id, amount)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0000000-0000-0000-0000-000000000001', 1)
  $$,
  '42501',
  null,
  'member cannot insert into log directly'
);

select throws_ok(
  $$ update public.purchase_log set amount = 99 $$,
  '42501',
  null,
  'member cannot update log'
);

select throws_ok(
  $$ delete from public.purchase_log $$,
  '42501',
  null,
  'member cannot delete from log'
);

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "aal": "aal2"}';

select is(
  (select count(*) from public.purchase_log),
  0::bigint,
  'member of another shelter sees no log rows'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$,
  'P0002',
  null,
  'purchase without second factor is rejected'
);

set local role anon;

set local request.jwt.claims to '{}';

select throws_ok(
  $$ select count(*) from public.purchase_log $$,
  '42501',
  null,
  'anonymous cannot read log'
);

reset role;

select is(
  (select count(*) from public.purchase_log),
  1::bigint,
  'rejected attempts wrote nothing to the log'
);

select * from finish();

rollback;