begin;

select plan(8);

select has_column('public', 'purchase_items', 'note', 'note column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.purchase_items (id, shelter_id, name, category, unit, remaining, note) values
    ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 1', 'корм', 'кг', 5, 'Любая марка') $$,
  'item with a note is accepted'
);

select throws_ok(
  $$ insert into public.purchase_items (shelter_id, name, category, unit, remaining, note) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 2', 'корм', 'кг', 1, '   ') $$,
  '23514',
  null,
  'blank note is rejected'
);

select throws_ok(
  $$ insert into public.purchase_items (shelter_id, name, category, unit, remaining, note) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Item 3', 'корм', 'кг', 1, repeat('a', 301)) $$,
  '23514',
  null,
  'note of 301 characters is rejected'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select note from public.purchase_items where id = 'd1111111-1111-1111-1111-111111111111'),
  'Любая марка',
  'anonymous can read note'
);

select throws_ok(
  $$ update public.purchase_items set note = 'evil' $$,
  '42501',
  null,
  'anonymous cannot update note'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ update public.purchase_items set note = 'Обновлено' where id = 'd1111111-1111-1111-1111-111111111111' $$,
  'volunteer can update note'
);

select is(
  (select note from public.purchase_items where id = 'd1111111-1111-1111-1111-111111111111'),
  'Обновлено',
  'note is updated'
);

select * from finish();
