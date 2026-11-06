begin;

select plan(13);

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining, is_urgent) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Обычная', 'корм', 'kg', 5, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Срочная', 'корм', 'kg', 5, true);

select has_column('public', 'purchase_items', 'is_urgent', 'колонка is_urgent есть');

select col_not_null('public', 'purchase_items', 'is_urgent', 'is_urgent обязателен');

select has_column('public', 'purchase_items', 'urgent_since', 'колонка urgent_since есть');

select has_trigger('public', 'purchase_items', 'purchase_items_set_urgent_since', 'триггер на месте');

select ok(
  (select urgent_since is null from public.purchase_items where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'у обычной позиции даты срочности нет'
);

select ok(
  (select urgent_since is not null from public.purchase_items where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'у позиции, созданной срочной, дата проставлена'
);

update public.purchase_items
  set is_urgent = true
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select ok(
  (select urgent_since is not null from public.purchase_items where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'включение срочности ставит дату'
);

alter table public.purchase_items disable trigger purchase_items_set_urgent_since;

update public.purchase_items
  set urgent_since = '2000-01-01 00:00:00+00'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

alter table public.purchase_items enable trigger purchase_items_set_urgent_since;

update public.purchase_items
  set name = 'Другое название'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select is(
  (select urgent_since from public.purchase_items where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  '2000-01-01 00:00:00+00'::timestamptz,
  'повторное сохранение не меняет дату срочности'
);

update public.purchase_items
  set is_urgent = false
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select ok(
  (select urgent_since is null from public.purchase_items where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'выключение срочности очищает дату'
);

alter table public.purchase_items disable trigger purchase_items_set_urgent_since;

select throws_ok(
  $$ update public.purchase_items set is_urgent = true where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  '23514',
  null,
  'срочность без даты база не принимает'
);

alter table public.purchase_items enable trigger purchase_items_set_urgent_since;

select ok(
  has_column_privilege('authenticated', 'public.purchase_items', 'is_urgent', 'UPDATE'),
  'волонтёр может менять is_urgent'
);

select ok(
  not has_column_privilege('authenticated', 'public.purchase_items', 'urgent_since', 'UPDATE'),
  'волонтёр не может менять urgent_since'
);

select ok(
  not has_column_privilege('anon', 'public.purchase_items', 'is_urgent', 'UPDATE'),
  'гость не может менять is_urgent'
);

select * from finish();

rollback;
