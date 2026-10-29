begin;

select plan(7);

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.projects (id, shelter_id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект', 'Описание');

select is(
  (select stage from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  'в работе',
  'new project gets the default stage'
);

select throws_ok(
  $$insert into public.projects (shelter_id, title, description, stage) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 2', 'Описание', 'неизвестно')$$,
  '23514',
  null,
  'unknown stage is rejected'
);

insert into public.projects (id, shelter_id, title, description, stage) values
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 3', 'Описание', 'готовим');

select is(
  (select stage from public.projects where id = 'd0000000-0000-0000-0000-000000000002'),
  'готовим',
  'stage given on insert is stored'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'stage', 'INSERT'),
  true,
  'volunteer can set stage on insert'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'stage', 'UPDATE'),
  true,
  'volunteer can change stage'
);

select is(
  has_column_privilege('anon', 'public.projects', 'stage', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'stage', 'UPDATE'),
  false,
  'guest cannot write stage'
);

select is(
  has_column_privilege('anon', 'public.projects', 'stage', 'SELECT'),
  true,
  'guest can read stage'
);

select * from finish();

rollback;