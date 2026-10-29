begin;

select plan(4);

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Treatment', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест'
);

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

alter table public.pets disable trigger pets_set_needs_treatment_since;

update public.pets
  set needs_treatment_since = '2026-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

alter table public.pets enable trigger pets_set_needs_treatment_since;

select lives_ok(
  $$
    update public.pets
      set status = 'на лечении'
      where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  $$,
  'status на лечении is allowed'
);

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'status на лечении keeps the mark and its date'
);

update public.pets
  set needs_treatment_since = null
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since = now() from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  true,
  'mark can be switched on again at status на лечении with a fresh date'
);

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt,
  status, needs_treatment_since
) values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Created in treatment', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест',
  'на лечении', '2000-01-01 00:00:00+00'
);

select is(
  (select needs_treatment_since = now() from public.pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  true,
  'animal created as на лечении keeps the mark'
);

select * from finish();

rollback;