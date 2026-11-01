begin;

select plan(6);

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.projects (id, shelter_id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект', 'Описание');

select is(
  (select is_pinned from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  false,
  'new project is not pinned by default'
);

insert into public.projects (id, shelter_id, title, description, is_pinned) values
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект 2', 'Описание', true);

select is(
  (select is_pinned from public.projects where id = 'd0000000-0000-0000-0000-000000000002'),
  true,
  'coordinator can pin a project on insert'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'is_pinned', 'INSERT'),
  false,
  'volunteer cannot set is_pinned on insert'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'is_pinned', 'UPDATE'),
  false,
  'volunteer cannot change is_pinned'
);

select is(
  has_column_privilege('anon', 'public.projects', 'is_pinned', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'is_pinned', 'UPDATE'),
  false,
  'guest cannot write is_pinned'
);

select is(
  has_column_privilege('anon', 'public.projects', 'is_pinned', 'SELECT'),
  true,
  'guest can read is_pinned'
);

select * from finish();

rollback;
