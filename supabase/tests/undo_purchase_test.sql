begin;

select plan(15);

select has_function('public', 'undo_purchase', array['uuid'], 'undo_purchase exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.purchase_items (id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'Корм для щенков', 'корм', 'кг', 10);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 3);
select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 2);

select throws_ok(
  $$ select public.undo_purchase((select id from public.purchase_log where amount = 3)) $$,
  'P0001', null, 'entry that is not the latest cannot be undone'
);

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  5::numeric,
  'rejected undo changed nothing'
);

select is(
  (select public.undo_purchase((select id from public.purchase_log where amount = 2))),
  7::numeric,
  'latest purchase is undone and the amount returns to the need'
);

select is((select count(*) from public.purchase_log), 1::bigint, 'undone entry is removed from the log');

select is(
  (select public.undo_purchase((select id from public.purchase_log where amount = 3))),
  10::numeric,
  'next entry becomes the latest and can be undone'
);

select is((select count(*) from public.purchase_log), 0::bigint, 'log is empty after both undos');

select lives_ok(
  $$ select public.receive_purchase('d0000000-0000-0000-0000-000000000001', 4) $$,
  'new purchase is recorded'
);

reset role;

update public.purchase_log set created_at = now() - interval '11 minutes';

create temp table log_ids as select id from public.purchase_log;
grant select on log_ids to authenticated, anon;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ select public.undo_purchase((select id from log_ids)) $$,
  'P0001', null, 'entry older than 10 minutes cannot be undone'
);

select is(
  (select remaining from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  6::numeric,
  'old entry left the need unchanged'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$ select public.undo_purchase((select id from log_ids)) $$,
  'P0002', null, 'non-volunteer cannot undo'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ select public.undo_purchase((select id from log_ids)) $$,
  'P0002', null, 'undo without second factor is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ select public.undo_purchase('00000000-0000-0000-0000-000000000000') $$,
  'P0002', null, 'unknown log entry is rejected'
);

set local role anon;
set local request.jwt.claims to '{}';

select throws_ok(
  $$ select public.undo_purchase('00000000-0000-0000-0000-000000000000') $$,
  '42501', null, 'anonymous cannot call undo_purchase'
);

reset role;

select is((select count(*) from public.purchase_log), 1::bigint, 'rejected attempts did not touch the log');

select * from finish();

rollback;
