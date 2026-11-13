begin;

select plan(10);

insert into public.shelter (name, is_published) values ('Shelter A', true);

insert into public.purchase_items (id, name, category, unit, remaining, is_urgent) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Обычная', 'корм', 'kg', 5, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Срочная', 'корм', 'kg', 5, true);

select has_column('public', 'purchase_items', 'is_urgent', 'колонка is_urgent есть');

select col_not_null('public', 'purchase_items', 'is_urgent', 'is_urgent обязателен');

select hasnt_column('public', 'purchase_items', 'urgent_since', 'колонки urgent_since нет');

select hasnt_function('public', 'purchase_items_set_urgent_since', 'функции даты срочности нет');

select hasnt_trigger('public', 'purchase_items', 'purchase_items_set_urgent_since', 'триггера даты срочности нет');

select ok(
  (select is_urgent from public.purchase_items where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'позиция, созданная срочной, срочная'
);

update public.purchase_items
  set is_urgent = true
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select ok(
  (select is_urgent from public.purchase_items where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'срочность включается'
);

update public.purchase_items
  set is_urgent = false
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select ok(
  not (select is_urgent from public.purchase_items where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'срочность выключается'
);

select ok(
  has_column_privilege('authenticated', 'public.purchase_items', 'is_urgent', 'UPDATE'),
  'волонтёр может менять is_urgent'
);

select ok(
  not has_column_privilege('anon', 'public.purchase_items', 'is_urgent', 'UPDATE'),
  'гость не может менять is_urgent'
);

select * from finish();

rollback;
