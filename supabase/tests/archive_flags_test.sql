begin;

select plan(13);

select has_column('public', 'purchase_items', 'is_archived', 'purchase_items has is_archived');
select has_column('public', 'projects', 'is_archived', 'projects has is_archived');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.purchase_items (id, shelter_id, name, category, unit, remaining) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корм закрытый', 'корм', 'кг', 0),
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корм нужный', 'корм', 'кг', 5);

insert into public.projects (id, shelter_id, title, description, goal, status) values
  ('e0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект один', 'Описание', 'Цель', 'идёт'),
  ('e0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект два', 'Описание', 'Цель', 'идёт');

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ update public.purchase_items set is_archived = true where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'member can archive a closed item'
);

select is(
  (select is_archived from public.purchase_items where id = 'd0000000-0000-0000-0000-000000000001'),
  true,
  'closed item is archived'
);

select throws_ok(
  $$ update public.purchase_items set is_archived = true where id = 'd0000000-0000-0000-0000-000000000002' $$,
  '23514',
  null,
  'item with a need cannot be archived'
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
  'member can archive a project'
);

select is(
  (select count(*)::int from public.projects where id = 'e0000000-0000-0000-0000-000000000001'),
  1,
  'member still sees the archived project of the shelter'
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
  'user without membership does not see the archived project'
);

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "aal": "aal2"}';

update public.projects set is_archived = true
where id = 'e0000000-0000-0000-0000-000000000002';

reset role;

select is(
  (select is_archived from public.projects where id = 'e0000000-0000-0000-0000-000000000002'),
  false,
  'member of another shelter cannot archive the project'
);

select * from finish();

rollback;
