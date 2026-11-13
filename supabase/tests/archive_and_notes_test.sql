begin;

select plan(21);

select has_column('public', 'purchase_items', 'is_archived', 'purchase_items has is_archived');
select has_column('public', 'projects', 'is_archived', 'projects has is_archived');
select has_column('public', 'purchase_items', 'note', 'note column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.purchase_items (id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'Корм закрытый', 'корм', 'кг', 0),
  ('d0000000-0000-0000-0000-000000000002', 'Корм нужный', 'корм', 'кг', 5);

insert into public.projects (id, title, description, status) values
  ('e0000000-0000-0000-0000-000000000001', 'Проект один', 'Описание', 'идёт'),
  ('e0000000-0000-0000-0000-000000000002', 'Проект два', 'Описание', 'идёт');

select lives_ok(
  $$ insert into public.purchase_items (id, name, category, unit, remaining, note) values
    ('d1111111-1111-1111-1111-111111111111', 'Item 1', 'корм', 'кг', 5, 'Любая марка') $$,
  'item with a note is accepted'
);
select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining, note) values ('Item 2', 'корм', 'кг', 1, '   ') $$,
  '23514', null, 'blank note is rejected'
);
select throws_ok(
  $$ insert into public.purchase_items (name, category, unit, remaining, note) values ('Item 3', 'корм', 'кг', 1, repeat('a', 301)) $$,
  '23514', null, 'note of 301 characters is rejected'
);

set local role anon;
set local request.jwt.claims to '{}';

select is(
  (select note from public.purchase_items where id = 'd1111111-1111-1111-1111-111111111111'),
  'Любая марка',
  'anonymous can read the note'
);
select throws_ok($$ update public.purchase_items set note = 'evil' $$, '42501', null, 'anonymous cannot update the note');

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ update public.purchase_items set note = 'Обновлено' where id = 'd1111111-1111-1111-1111-111111111111' $$,
  'volunteer can update the note'
);
select is(
  (select note from public.purchase_items where id = 'd1111111-1111-1111-1111-111111111111'),
  'Обновлено',
  'note is updated'
);

select lives_ok(
  $$ update public.purchase_items set is_archived = true where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'volunteer can archive a closed item'
);
select is(
  (select is_archived from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  true,
  'closed item is archived'
);
select throws_ok(
  $$ update public.purchase_items set is_archived = true where id = 'd0000000-0000-0000-0000-000000000002' $$,
  '23514', null, 'item with a need cannot be archived'
);
select is(
  (select public.record_consumption('d0000000-0000-0000-0000-000000000001', 3)),
  3::numeric,
  'consumption turns an archived item back into a need'
);
select is(
  (select is_archived from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  false,
  'consumption removes the archive flag'
);

select lives_ok(
  $$ update public.projects set is_archived = true where id = 'e0000000-0000-0000-0000-000000000001' $$,
  'volunteer can archive a project'
);
select is(
  (select count(*)::int from public.projects where id = 'e0000000-0000-0000-0000-000000000001'),
  1,
  'volunteer still sees the archived project'
);

set local role anon;
set local request.jwt.claims to '{}';

select is(
  (select count(*)::int from public.projects where id = 'e0000000-0000-0000-0000-000000000001'),
  0,
  'anonymous does not see the archived project'
);
select is(
  (select count(*)::int from public.projects where id = 'e0000000-0000-0000-0000-000000000002'),
  1,
  'anonymous sees the active project'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is(
  (select count(*)::int from public.projects where id = 'e0000000-0000-0000-0000-000000000001'),
  0,
  'non-volunteer does not see the archived project'
);

update public.projects set is_archived = true where id = 'e0000000-0000-0000-0000-000000000002';

reset role;

select is(
  (select is_archived from public.projects where id = 'e0000000-0000-0000-0000-000000000002'),
  false,
  'non-volunteer cannot archive a project'
);

select * from finish();

rollback;
