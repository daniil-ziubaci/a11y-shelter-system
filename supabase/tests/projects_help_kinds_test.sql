begin;

select plan(10);

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.projects (id, shelter_id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект', 'Описание');

select is(
  (select help_kinds from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  array['money']::text[],
  'new project asks for money by default'
);

select lives_ok(
  $$insert into public.projects (id, shelter_id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 2', 'Описание', array['things'])$$,
  'project can ask for things only'
);

select lives_ok(
  $$insert into public.projects (id, shelter_id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 3', 'Описание', array['things', 'money'])$$,
  'project can ask for things and money'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 4', 'Описание', '{}')$$,
  '23514',
  null,
  'empty help_kinds is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 5', 'Описание', array['things', 'cars'])$$,
  '23514',
  null,
  'unknown help kind is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, help_kinds) values
    ('d0000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 6', 'Описание', null)$$,
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
