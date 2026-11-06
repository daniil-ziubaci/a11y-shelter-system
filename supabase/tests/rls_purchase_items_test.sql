begin;

select plan(25);

select has_table('public', 'purchase_items', 'purchase_items table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корм для щенков', 'корм', 'кг', 8),
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Наполнитель', 'гигиена', 'кг', -4),
  ('d0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Шприцы', 'расходники', 'шт', 0),
  ('d0000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Корм для кошек', 'корм', 'кг', 5),
  ('d0000000-0000-0000-0000-000000000005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Дезсредство', 'дезинфекция', 'л', -3);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select count(*) from public.purchase_items),
  2::bigint,
  'anonymous sees only open needs of all shelters'
);

select is(
  (select count(*) from public.purchase_items where remaining <= 0),
  0::bigint,
  'anonymous never sees closed items or stock'
);

select throws_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'корм', 'кг', 1)
  $$,
  '42501',
  null,
  'anonymous cannot insert'
);

select throws_ok(
  $$
    update public.purchase_items set name = 'Взлом'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'anonymous cannot update'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select count(*) from public.purchase_items where shelter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  3::bigint,
  'member sees all items of own shelter including stock and zero'
);

select is(
  (select count(*) from public.purchase_items where shelter_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1::bigint,
  'member sees only open needs of another shelter'
);

select lives_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Пелёнки', 'расходники', 'шт', 2)
  $$,
  'member can add item to own shelter'
);

select throws_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test', 'корм', 'кг', 1)
  $$,
  '42501',
  null,
  'member cannot add item to another shelter'
);

select lives_ok(
  $$
    update public.purchase_items
    set name = 'Корм для щенков (старый)', category = 'лекарства'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  'member can change name and category of own item'
);

select is(
  (select name from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  'Корм для щенков (старый)',
  'own item name was changed'
);

select throws_ok(
  $$
    update public.purchase_items set remaining = 99
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot change remaining directly'
);

select throws_ok(
  $$
    update public.purchase_items set unit = 'шт'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot change unit'
);

select throws_ok(
  $$
    update public.purchase_items
    set shelter_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot move item to another shelter'
);

select lives_ok(
  $$
    update public.purchase_items set name = 'Взлом'
    where id = 'd0000000-0000-0000-0000-000000000004'
  $$,
  'update of another shelter item raises no error'
);

select is(
  (select name from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000004'),
  'Корм для кошек',
  'item of another shelter was not changed'
);

select throws_ok(
  $$
    delete from public.purchase_items
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot delete items'
);

select throws_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'игрушки', 'шт', 1)
  $$,
  '23514',
  null,
  'unknown category is rejected'
);

select throws_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '   ', 'корм', 'кг', 1)
  $$,
  '23514',
  null,
  'blank name is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'корм', 'кг', 1)
  $$,
  '42501',
  null,
  'insert without second factor is rejected'
);

select lives_ok(
  $$
    update public.purchase_items set name = 'Без второго фактора'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  'update without second factor raises no error'
);

select is(
  (select name from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  'Корм для щенков (старый)',
  'update without second factor changed nothing'
);

select is(
  (select count(*) from public.purchase_items where shelter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  4::bigint,
  'reading does not require second factor'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is(
  (select count(*) from public.purchase_items),
  3::bigint,
  'user without membership sees only open needs'
);

select throws_ok(
  $$
    insert into public.purchase_items (shelter_id, name, category, unit, remaining)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'корм', 'кг', 1)
  $$,
  '42501',
  null,
  'user without membership cannot insert'
);

select * from finish();

rollback;