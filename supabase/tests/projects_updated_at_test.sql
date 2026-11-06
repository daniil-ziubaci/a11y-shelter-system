begin;
select plan(5);

insert into public.shelters (id, name, slug)
values ('00000000-0000-0000-0000-0000000000a1', 'Тест', 'updated-at-test');

insert into public.projects (id, shelter_id, title, description)
values (
  '00000000-0000-0000-0000-0000000000b1',
  '00000000-0000-0000-0000-0000000000a1',
  'Проект',
  'Описание'
);

select has_column('public', 'projects', 'updated_at', 'колонка updated_at есть');

select col_not_null('public', 'projects', 'updated_at', 'updated_at обязателен');

select ok(
  (select updated_at from public.projects where id = '00000000-0000-0000-0000-0000000000b1')
    >= (select created_at from public.projects where id = '00000000-0000-0000-0000-0000000000b1'),
  'при создании updated_at не раньше created_at'
);

update public.projects
set created_at = now() - interval '1 day'
where id = '00000000-0000-0000-0000-0000000000b1';

update public.projects
set title = 'Проект 2'
where id = '00000000-0000-0000-0000-0000000000b1';

select ok(
  (select updated_at from public.projects where id = '00000000-0000-0000-0000-0000000000b1')
    > (select created_at from public.projects where id = '00000000-0000-0000-0000-0000000000b1'),
  'после правки updated_at позже created_at'
);

select has_trigger('public', 'projects', 'projects_set_updated_at', 'триггер на месте');

select * from finish();
rollback;