begin;

select plan(25);

select has_table('public', 'purchase_items', 'purchase_items table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.purchase_items (id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'Корм для щенков', 'корм', 'кг', 8),
  ('d0000000-0000-0000-0000-000000000002', 'Наполнитель', 'гигиена', 'кг', -4),
  ('d0000000-0000-0000-0000-000000000003', 'Шприцы', 'расходники', 'шт', 0),
  ('d0000000-0000-0000-0000-000000000004', 'Корм для кошек', 'корм', 'кг', 5);

set local role anon;
set local request.jwt.claims to '{}';

select is(
  (select count(*) from public.purchase_items),
  2::bigint,
  'anonymous sees only open needs'
);

select is(
  (select count(*) from public.purchase_items where remaining <= 0),
  0::bigint,
  'anonymous never sees closed items or stock'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('Test', 'корм', 'кг', 1) $$,
  '42501',
  null,
  'anonymous cannot insert'
);

select throws_ok(
  $$ update public.purchase_items set name = 'Взлом' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'anonymous cannot update'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select count(*) from public.purchase_items),
  4::bigint,
  'volunteer sees all items including stock and zero'
);

select is(
  (select count(*) from public.purchase_items where remaining <= 0),
  2::bigint,
  'volunteer sees closed items and stock'
);

select lives_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('Пелёнки', 'расходники', 'шт', 2) $$,
  'volunteer can add an item'
);

select lives_ok(
  $$
    update public.purchase_items
    set name = 'Корм для щенков (старый)', category = 'лекарства'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  'volunteer can change name and category'
);

select is(
  (select name from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  'Корм для щенков (старый)',
  'item name was changed'
);

select throws_ok(
  $$ update public.purchase_items set remaining = 99 where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot change remaining directly'
);

select throws_ok(
  $$ update public.purchase_items set unit = 'шт' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot change unit'
);

select throws_ok(
  $$ update public.purchase_items set created_at = now() where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot change the creation date'
);

select throws_ok(
  $$ delete from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot delete items'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('Test', 'игрушки', 'шт', 1) $$,
  '23514',
  null,
  'unknown category is rejected'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('   ', 'корм', 'кг', 1) $$,
  '23514',
  null,
  'blank name is rejected'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('Test', 'корм', '  ', 1) $$,
  '23514',
  null,
  'blank unit is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('Test', 'корм', 'кг', 1) $$,
  '42501',
  null,
  'insert without second factor is rejected'
);

select lives_ok(
  $$ update public.purchase_items set name = 'Без второго фактора' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'update without second factor raises no error'
);

select is(
  (select name from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  'Корм для щенков (старый)',
  'update without second factor changed nothing'
);

select is(
  (select count(*) from public.purchase_items),
  5::bigint,
  'reading does not require second factor'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is(
  (select count(*) from public.purchase_items),
  3::bigint,
  'logged-in non-volunteer sees only open needs'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values ('Test', 'корм', 'кг', 1) $$,
  '42501',
  null,
  'non-volunteer cannot insert'
);

select lives_ok(
  $$ update public.purchase_items set name = 'Взлом' where id = 'd0000000-0000-0000-0000-000000000004' $$,
  'update by a non-volunteer raises no error'
);

select is(
  (select name from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000004'),
  'Корм для кошек',
  'item was not changed by a non-volunteer'
);

select * from finish();

rollback;
