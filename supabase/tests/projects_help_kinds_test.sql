begin;

select plan(10);

insert into public.shelter (name, is_published) values ('Shelter A', true);

insert into public.projects (id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'Проект', 'Описание');

select is(
  (select help_kinds from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  array['money']::text[],
  'new project asks for money by default'
);

select lives_ok(
  $$insert into public.projects (id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000002', 'Проект 2', 'Описание', array['things'])$$,
  'project can ask for things only'
);

select lives_ok(
  $$insert into public.projects (id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000003', 'Проект 3', 'Описание', array['things', 'money'])$$,
  'project can ask for things and money'
);

select throws_ok(
  $$insert into public.projects (id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000004', 'Проект 4', 'Описание', '{}')$$,
  '23514',
  null,
  'empty help_kinds is rejected'
);

select throws_ok(
  $$insert into public.projects (id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000005', 'Проект 5', 'Описание', array['things', 'cars'])$$,
  '23514',
  null,
  'unknown help kind is rejected'
);

select throws_ok(
  $$insert into public.projects (id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000006', 'Проект 6', 'Описание', null)$$,
  '23502',
  null,
  'null help_kinds is rejected'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'help_kinds', 'INSERT'),
  true,
  'volunteer can set help_kinds on insert'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'help_kinds', 'UPDATE'),
  true,
  'volunteer can change help_kinds'
);

select is(
  has_column_privilege('anon', 'public.projects', 'help_kinds', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'help_kinds', 'UPDATE'),
  false,
  'guest cannot write help_kinds'
);

select is(
  has_column_privilege('anon', 'public.projects', 'help_kinds', 'SELECT'),
  true,
  'guest can read help_kinds'
);

select * from finish();

rollback;
