begin;

select plan(4);

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

select lives_ok(
  $$ insert into public.purchase_items (shelter_id, name, category, unit, remaining) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 1', 'амуниция', 'шт', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 2', 'инвентарь', 'шт', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 3', 'территория', 'шт', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 4', 'рабочим', 'шт', 1) $$,
  'new categories are accepted'
);

select lives_ok(
  $$ insert into public.purchase_items (shelter_id, name, category, unit, remaining) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 5', 'корм', 'кг', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 6', 'лекарства', 'шт', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 7', 'расходники', 'шт', 1),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 8', 'гигиена', 'шт', 1) $$,
  'kept categories are accepted'
);

select throws_ok(
  $$ insert into public.purchase_items (shelter_id, name, category, unit, remaining) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 9', 'дезинфекция', 'шт', 1) $$,
  '23514',
  null,
  'removed category is rejected'
);

select throws_ok(
  $$ insert into public.purchase_items (shelter_id, name, category, unit, remaining) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 10', 'другое', 'шт', 1) $$,
  '23514',
  null,
  'unknown category is rejected'
);

select * from finish();
