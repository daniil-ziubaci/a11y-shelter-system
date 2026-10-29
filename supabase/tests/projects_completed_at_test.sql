begin;

select plan(8);

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.projects (id, shelter_id, title, description) values
  ('d0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Проект', 'Описание');

select is(
  (select completed_at from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  null::timestamptz,
  'new project in progress has no completion date'
);

update public.projects set status = 'завершён'
  where id = 'd0000000-0000-0000-0000-000000000001';

select is(
  (select completed_at = now() from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  true,
  'finishing a project sets the current time'
);

alter table public.projects disable trigger projects_set_completed_at;

update public.projects set completed_at = '2026-01-01 00:00:00+00'
  where id = 'd0000000-0000-0000-0000-000000000001';

alter table public.projects enable trigger projects_set_completed_at;

select is(
  (select completed_at from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'old date is stored while trigger is disabled'
);

update public.projects set title = 'Проект 2'
  where id = 'd0000000-0000-0000-0000-000000000001';

select is(
  (select completed_at from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'saving a finished project keeps its completion date'
);

update public.projects set status = 'идёт'
  where id = 'd0000000-0000-0000-0000-000000000001';

select is(
  (select completed_at from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  null::timestamptz,
  'returning to in progress clears the completion date'
);

update public.projects set status = 'завершён'
  where id = 'd0000000-0000-0000-0000-000000000001';

select is(
  (select completed_at = now() from public.projects where id = 'd0000000-0000-0000-0000-000000000001'),
  true,
  'finishing again sets a fresh date'
);

insert into public.projects (id, shelter_id, title, description, status) values
  ('d0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Готовый', 'Описание', 'завершён');

select is(
  (select completed_at = now() from public.projects where id = 'd0000000-0000-0000-0000-000000000002'),
  true,
  'project created as finished gets the current time'
);

insert into public.projects (id, shelter_id, title, description, status, completed_at) values
  ('d0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'В работе', 'Описание', 'идёт', '2000-01-01 00:00:00+00');

select is(
  (select completed_at from public.projects where id = 'd0000000-0000-0000-0000-000000000003'),
  null::timestamptz,
  'project created in progress has no completion date even if one is given'
);

select * from finish();

rollback;