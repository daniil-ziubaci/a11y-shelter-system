begin;

select plan(16);

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.projects (id, shelter_id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект', 'Описание');

select is(
  (select progress_total is null and progress_done is null and progress_unit is null
     from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  true,
  'new project has no progress by default'
);

select lives_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П2', 'Описание', 20, 2, 'вольеров')$$,
  'project can have progress 2 of 20'
);

select lives_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П3', 'Описание', 20, 0, 'вольеров')$$,
  'progress can start at zero'
);

select lives_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П4', 'Описание', 20, 20, 'вольеров')$$,
  'progress can be complete'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total) values
    ('d0000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П5', 'Описание', 20)$$,
  '23514', null, 'total alone is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_done) values
    ('d0000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П6', 'Описание', 2)$$,
  '23514', null, 'done alone is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_unit) values
    ('d0000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П7', 'Описание', 'вольеров')$$,
  '23514', null, 'unit alone is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П8', 'Описание', 0, 0, 'вольеров')$$,
  '23514', null, 'total of zero is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П9', 'Описание', 1001, 1, 'вольеров')$$,
  '23514', null, 'total above 1000 is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П10', 'Описание', 20, 21, 'вольеров')$$,
  '23514', null, 'done above total is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П11', 'Описание', 20, -1, 'вольеров')$$,
  '23514', null, 'negative done is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П12', 'Описание', 20, 2, '   ')$$,
  '23514', null, 'blank unit is rejected'
);

select throws_ok(
  $$insert into public.projects (id, shelter_id, title, description, progress_total, progress_done, progress_unit) values
    ('d0000000-0000-0000-0000-000000000013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'П13', 'Описание', 20, 2, repeat('в', 31))$$,
  '23514', null, 'unit longer than 30 characters is rejected'
);

select is(
  has_column_privilege('authenticated', 'public.projects', 'progress_total', 'INSERT')
    and has_column_privilege('authenticated', 'public.projects', 'progress_total', 'UPDATE')
    and has_column_privilege('authenticated', 'public.projects', 'progress_done', 'INSERT')
    and has_column_privilege('authenticated', 'public.projects', 'progress_done', 'UPDATE')
    and has_column_privilege('authenticated', 'public.projects', 'progress_unit', 'INSERT')
    and has_column_privilege('authenticated', 'public.projects', 'progress_unit', 'UPDATE'),
  true,
  'volunteer can write progress columns'
);

select is(
  has_column_privilege('anon', 'public.projects', 'progress_total', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'progress_total', 'UPDATE')
    or has_column_privilege('anon', 'public.projects', 'progress_done', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'progress_done', 'UPDATE')
    or has_column_privilege('anon', 'public.projects', 'progress_unit', 'INSERT')
    or has_column_privilege('anon', 'public.projects', 'progress_unit', 'UPDATE'),
  false,
  'guest cannot write progress columns'
);

select is(
  has_column_privilege('anon', 'public.projects', 'progress_total', 'SELECT')
    and has_column_privilege('anon', 'public.projects', 'progress_done', 'SELECT')
    and has_column_privilege('anon', 'public.projects', 'progress_unit', 'SELECT'),
  true,
  'guest can read progress columns'
);

select * from finish();

rollback;
