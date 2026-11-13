begin;

select plan(10);

insert into public.shelter (name, is_published) values ('Shelter A', true);

insert into public.projects (id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'Проект', 'Описание');

select is(
  (select photo_path from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  null,
  'new project has no photo path by default'
);

select is(
  (select photo_alt from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  null,
  'new project has no photo description by default'
);

select lives_ok(
  $$insert into public.projects (id, title, description, photo_path, photo_alt) values
    ('d0000000-0000-0000-0000-000000000002', 'Проект 2', 'Описание', 'projects/photo.webp', 'Утеплённые вольеры')$$,
  'project can have a photo with a description'
);

select throws_ok(
  $$insert into public.projects (id, title, description, photo_path) values
    ('d0000000-0000-0000-0000-000000000003', 'Проект 3', 'Описание', 'projects/photo.webp')$$,
  '23514',
  null,
  'photo without a description is rejected'
);

select throws_ok(
  $$insert into public.projects (id, title, description, photo_alt) values
    ('d0000000-0000-0000-0000-000000000004', 'Проект 4', 'Описание', 'Утеплённые вольеры')$$,
  '23514',
  null,
  'description without a photo is rejected'
);

select throws_ok(
  $$insert into public.projects (id, title, description, photo_path, photo_alt) values
    ('d0000000-0000-0000-0000-000000000005', 'Проект 5', 'Описание', 'projects/photo.webp', '   ')$$,
  '23514',
  null,
  'blank photo description is rejected'
);

select throws_ok(
  $$insert into public.projects (id, title, description, photo_path, photo_alt) values
    ('d0000000-0000-0000-0000-000000000006', 'Проект 6', 'Описание', 'projects/photo.webp', repeat('а', 201))$$,
  '23514',
  null,
  'photo description longer than 200 characters is rejected'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'photo_path', 'INSERT')
    and has_column_privilege('authenticated', 'public.projects', 'photo_path', 'UPDATE')
    and has_column_privilege('authenticated', 'public.projects', 'photo_alt', 'INSERT')
    and has_column_privilege('authenticated', 'public.projects', 'photo_alt', 'UPDATE'),
  true,
  'volunteer can write photo columns'
);

select is(
  has_column_privilege('anon', 'public.projects', 'photo_path', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'photo_path', 'UPDATE')
    or has_column_privilege('anon', 'public.projects', 'photo_alt', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'photo_alt', 'UPDATE'),
  false,
  'guest cannot write photo columns'
);

select is(
  has_column_privilege('anon', 'public.projects', 'photo_path', 'SELECT')
    and has_column_privilege('anon', 'public.projects', 'photo_alt', 'SELECT'),
  true,
  'guest can read photo columns'
);

select * from finish();

rollback;
