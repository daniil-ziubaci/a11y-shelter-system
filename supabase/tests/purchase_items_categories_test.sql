begin;

select plan(4);

insert into public.shelter (name, is_published) values ('Shelter A', true);

select lives_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values
    ('Item 1', 'амуниция', 'шт', 1),
    ('Item 2', 'инвентарь', 'шт', 1),
    ('Item 3', 'территория', 'шт', 1),
    ('Item 4', 'рабочим', 'шт', 1) $$,
  'new categories are accepted'
);

select lives_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values
    ('Item 5', 'корм', 'кг', 1),
    ('Item 6', 'лекарства', 'шт', 1),
    ('Item 7', 'расходники', 'шт', 1),
    ('Item 8', 'гигиена', 'шт', 1) $$,
  'kept categories are accepted'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values
    ('Item 9', 'дезинфекция', 'шт', 1) $$,
  '23514',
  null,
  'removed category is rejected'
);

select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining) values
    ('Item 10', 'другое', 'шт', 1) $$,
  '23514',
  null,
  'unknown category is rejected'
);

select * from finish();
