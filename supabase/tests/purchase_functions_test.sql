begin;

select plan(46);

select has_function('public', 'receive_purchase', array['uuid', 'numeric'], 'receive_purchase exists');
select has_function('public', 'record_consumption', array['uuid', 'numeric'], 'record_consumption exists');
select has_table('public', 'purchase_log', 'purchase_log table exists');
select hasnt_column('public', 'purchase_log', 'shelter_id', 'purchase_log has no shelter_id');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.purchase_items (id, name, category, unit, remaining, is_urgent) values
  ('d0000000-0000-0000-0000-000000000001', 'Корм для щенков', 'корм', 'кг', 10, false),
  ('d0000000-0000-0000-0000-000000000002', 'Наполнитель', 'гигиена', 'кг', -13, false),
  ('d0000000-0000-0000-0000-000000000003', 'Закрытая', 'корм', 'кг', 0, true),
  ('d0000000-0000-0000-0000-000000000004', 'Запас', 'корм', 'кг', -5, true),
  ('d0000000-0000-0000-0000-000000000005', 'Нужда', 'корм', 'кг', 5, true);

set local role anon;
set local request.jwt.claims to '{}';

select throws_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$,
  '42501', null, 'anonymous cannot call receive_purchase'
);

select throws_ok(
  $$ select public.record_consumption('d0000000-0000-0000-0000-000000000001', 1) $$,
  '42501', null, 'anonymous cannot call record_consumption'
);

select throws_ok(
  $$ select count(*) from public.purchase_log $$,
  '42501', null, 'anonymous cannot read the log'
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
  'fractional purchases are supported'
);

select is(
  (select count(*) from public.purchase_log where item_id = 'd0000000-0000-0000-0000-000000000001'),
  4::bigint,
  'each purchase is logged'
);

select is(
  (select amount from public.purchase_log order by created_at desc limit 1),
  0.5::numeric,
  'log row keeps the purchased amount'
);

select throws_ok($$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 0) $$, '22023', null, 'zero purchase is rejected');
select throws_ok($$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', -1) $$, '22023', null, 'negative purchase is rejected');
select throws_ok($$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 100001) $$, '22023', null, 'too large purchase is rejected');
select throws_ok($$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', null) $$, '22023', null, 'empty purchase is rejected');
select throws_ok($$ select public.receive_purchase('00000000-0000-0000-0000-000000000000', 1) $$, 'P0002', null, 'purchase of an unknown item is rejected');

select throws_ok(
  $$ insert into public.purchase_log (item_id, amount) values ('d0000000-0000-0000-0000-000000000001', 1) $$,
  '42501', null, 'volunteer cannot insert into the log directly'
);
select throws_ok($$ update public.purchase_log set amount = 99 $$, '42501', null, 'volunteer cannot update the log');
select throws_ok($$ delete from public.purchase_log $$, '42501', null, 'volunteer cannot delete from the log');

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000002', 5)),
  -8::numeric,
  'consumption below the stock reduces the stock'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000002', 8)),
  0::numeric,
  'consumption equal to the stock leaves nothing'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000002', 7)),
  7::numeric,
  'consumption above the stock becomes a need'
);

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000002', 0.5)),
  7.5::numeric,
  'fractional consumption is supported'
);

select throws_ok($$ select public.record_consumption('d0000000-0000-0000-0000-000000000002', 0) $$, '22023', null, 'zero consumption is rejected');
select throws_ok($$ select public.record_consumption('d0000000-0000-0000-0000-000000000002', -1) $$, '22023', null, 'negative consumption is rejected');
select throws_ok($$ select public.record_consumption('d0000000-0000-0000-0000-000000000002', 100001) $$, '22023', null, 'too large consumption is rejected');
select throws_ok($$ select public.record_consumption('00000000-0000-0000-0000-000000000000', 1) $$, 'P0002', null, 'consumption of an unknown item is rejected');

select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000003', 3)),
  3::numeric,
  'a closed item becomes a need again'
);
select is(
  (select is_urgent from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000003'),
  false,
  'a closed item returns without the urgent mark'
);
select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000004', 8)),
  3::numeric,
  'a used-up stock becomes a need'
);
select is(
  (select is_urgent from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000004'),
  false,
  'an item returning from stock is not urgent'
);
select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000005', 2)),
  7::numeric,
  'consumption adds to an existing need'
);
select is(
  (select is_urgent from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000005'),
  true,
  'an item that was already a need stays urgent'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok($$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$, 'P0002', null, 'purchase without second factor is rejected');
select throws_ok($$ select public.record_consumption('d0000000-0000-0000-0000-000000000002', 1) $$, 'P0002', null, 'consumption without second factor is rejected');
select is((select count(*) from public.purchase_log), 4::bigint, 'volunteer without second factor can still read the log');

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok($$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 1) $$, 'P0002', null, 'non-volunteer cannot record a purchase');
select throws_ok($$ select public.record_consumption('d0000000-0000-0000-0000-000000000002', 1) $$, 'P0002', null, 'non-volunteer cannot record consumption');
select is((select count(*) from public.purchase_log), 0::bigint, 'non-volunteer sees no log rows');

reset role;

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  -2.5::numeric,
  'rejected purchases did not change the item'
);
select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000002'),
  7.5::numeric,
  'rejected consumption did not change the item'
);
select is((select count(*) from public.purchase_log), 4::bigint, 'rejected attempts wrote nothing to the log');

select is(
  (select prosecdef from pg_proc where oid = 'public.receive_purchase(uuid, numeric)'::regprocedure),
  true,
  'receive_purchase runs as owner so the volunteer never writes remaining directly'
);

select ok(
  not has_function_privilege('anon', 'public.undo_purchase(uuid)', 'execute'),
  'anonymous cannot execute undo_purchase'
);

select * from finish();

rollback;
