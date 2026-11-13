begin;

select plan(5);

insert into public.shelter (name, is_published) values ('Shelter A', true);

insert into public.pets (
  id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Status', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);

select has_column('public', 'pets', 'status_changed_at', 'колонка status_changed_at есть');

select col_not_null('public', 'pets', 'status_changed_at', 'status_changed_at обязателен');

select has_trigger('public', 'pets', 'pets_set_status_changed_at', 'триггер на месте');

alter table public.pets disable trigger pets_set_status_changed_at;

update public.pets
  set status_changed_at = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

alter table public.pets enable trigger pets_set_status_changed_at;

update public.pets
  set description = 'другое описание'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select status_changed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2000-01-01 00:00:00+00'::timestamptz,
  'правка описания не меняет status_changed_at'
);

update public.pets
  set status = status
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select ok(
  (select status_changed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd')
    > '2000-01-01 00:00:00+00'::timestamptz,
  'повторное сохранение статуса обновляет status_changed_at'
);

select * from finish();

rollback;
