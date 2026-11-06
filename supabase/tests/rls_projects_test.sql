begin;

select plan(18);

select has_table('public', 'projects', 'projects table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into public.projects (id, shelter_id, title, description, status) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Тёплые вольеры', 'Утеплить вольеры к зиме', 'идёт'),
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Крыша', 'Перекрыть крышу', 'завершён'),
  ('d0000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Электрика', 'Заменить проводку', 'идёт');

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select count(*) from public.projects),
  3::bigint,
  'anonymous sees projects of all shelters'
);

select throws_ok(
  $$
    insert into public.projects (shelter_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test', 'Test')
  $$,
  '42501',
  null,
  'anonymous cannot insert'
);

select throws_ok(
  $$
    update public.projects set title = 'Взлом'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'anonymous cannot update'
);

select throws_ok(
  $$
    delete from public.projects
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'anonymous cannot delete'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into public.projects (shelter_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Новый проект', 'Описание')
  $$,
  'member can add a project to own shelter'
);

select throws_ok(
  $$
    insert into public.projects (shelter_id, title, description)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Чужой', 'Чужой')
  $$,
  '42501',
  null,
  'member cannot add a project to another shelter'
);

select lives_ok(
  $$
    update public.projects set title = 'Тёплые вольеры к зиме'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  'member can update a project of own shelter'
);

select is(
  (select title from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  'Тёплые вольеры к зиме',
  'title of own project was changed'
);

update public.projects set title = 'Взлом'
  where id = 'd0000000-0000-0000-0000-000000000003';

select is(
  (select title from public.projects where id = 'd0000000-0000-0000-0000-000000000003'),
  'Электрика',
  'member cannot update a project of another shelter'
);

select throws_ok(
  $$
    update public.projects
    set shelter_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot move a project to another shelter'
);

select throws_ok(
  $$
    update public.projects set completed_at = now()
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot set the completion date directly'
);

select throws_ok(
  $$
    delete from public.projects
    where id = 'd0000000-0000-0000-0000-000000000001'
  $$,
  '42501',
  null,
  'member cannot delete a project'
);

select throws_ok(
  $$
    insert into public.projects (shelter_id, title, description, status)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Статус', 'Описание', 'другой')
  $$,
  '23514',
  null,
  'unknown status is rejected'
);

select throws_ok(
  $$
    insert into public.projects (shelter_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '   ', 'Описание')
  $$,
  '23514',
  null,
  'blank title is rejected'
);

select throws_ok(
  $$
    insert into public.projects (shelter_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Длинный', repeat('а', 1001))
  $$,
  '23514',
  null,
  'description over 1000 characters is rejected'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$
    insert into public.projects (shelter_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Без второго фактора', 'Описание')
  $$,
  '42501',
  null,
  'member without second factor cannot add a project'
);

update public.projects set title = 'Без второго фактора'
  where id = 'd0000000-0000-0000-0000-000000000001';

select is(
  (select title from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  'Тёплые вольеры к зиме',
  'member without second factor cannot update a project'
);

select * from finish();

rollback;