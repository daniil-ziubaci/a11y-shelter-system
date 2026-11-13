begin;

select plan(19);

select has_table('public', 'projects', 'projects table exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.projects (id, title, description, status) values
  ('d0000000-0000-0000-0000-000000000001', 'Тёплые вольеры', 'Утеплить вольеры к зиме', 'идёт'),
  ('d0000000-0000-0000-0000-000000000002', 'Крыша', 'Перекрыть крышу', 'завершён'),
  ('d0000000-0000-0000-0000-000000000003', 'Электрика', 'Заменить проводку', 'идёт');

set local role anon;
set local request.jwt.claims to '{}';

select is(
  (select count(*) from public.projects),
  3::bigint,
  'anonymous sees the active projects'
);

select throws_ok(
  $$ insert into public.projects (title, description) values ('Test', 'Test') $$,
  '42501',
  null,
  'anonymous cannot insert'
);

select throws_ok(
  $$ update public.projects set title = 'Взлом' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'anonymous cannot update'
);

select throws_ok(
  $$ delete from public.projects where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'anonymous cannot delete'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ insert into public.projects (title, description) values ('Новый проект', 'Описание') $$,
  'volunteer can add a project'
);

select lives_ok(
  $$ update public.projects set title = 'Тёплые вольеры к зиме' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'volunteer can update a project'
);

select is(
  (select title from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  'Тёплые вольеры к зиме',
  'title of the project was changed'
);

select throws_ok(
  $$ update public.projects set created_at = now() - interval '1 year' where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot change the creation date (it sets the order on the site)'
);

select throws_ok(
  $$ update public.projects set completed_at = now() where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot set the completion date directly'
);

select throws_ok(
  $$ delete from public.projects where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'volunteer cannot delete a project'
);

select throws_ok(
  $$ insert into public.projects (title, description, status) values ('Статус', 'Описание', 'другой') $$,
  '23514',
  null,
  'unknown status is rejected'
);

select throws_ok(
  $$ insert into public.projects (title, description) values ('   ', 'Описание') $$,
  '23514',
  null,
  'blank title is rejected'
);

select throws_ok(
  $$ insert into public.projects (title, description) values ('Длинный', repeat('а', 1001)) $$,
  '23514',
  null,
  'description over 1000 characters is rejected'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$ insert into public.projects (title, description) values ('Чужой', 'Чужой') $$,
  '42501',
  null,
  'non-volunteer cannot add a project'
);

update public.projects set title = 'Взлом' where id = 'd0000000-0000-0000-0000-000000000003';

select is(
  (select title from public.projects where id = 'd0000000-0000-0000-0000-000000000003'),
  'Электрика',
  'non-volunteer cannot update a project'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ insert into public.projects (title, description) values ('Без второго фактора', 'Описание') $$,
  '42501',
  null,
  'volunteer without second factor cannot add a project'
);

update public.projects set title = 'Без второго фактора' where id = 'd0000000-0000-0000-0000-000000000001';

select is(
  (select title from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  'Тёплые вольеры к зиме',
  'volunteer without second factor cannot update a project'
);

select is(
  (select count(*) from public.projects),
  4::bigint,
  'volunteer without second factor can still read projects'
);

select * from finish();

rollback;
