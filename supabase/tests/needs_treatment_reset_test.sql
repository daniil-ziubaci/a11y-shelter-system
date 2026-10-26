begin;

select plan(10);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Reset', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест'
);

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since = now() from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  true,
  'switching on at status ищет дом sets current time'
);

alter table public.pets disable trigger pets_set_needs_treatment_since;

update public.pets
  set needs_treatment_since = '2026-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

alter table public.pets enable trigger pets_set_needs_treatment_since;

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'old date is stored while trigger is disabled'
);

update public.pets
  set status = 'в процессе'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'status в процессе keeps the mark and its date'
);

update public.pets
  set status = 'пристроен'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'status пристроен clears the mark'
);

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'mark cannot be switched on while status is пристроен'
);

update public.pets
  set status = 'ищет дом'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since = now() from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  true,
  'mark can be switched on again with a fresh date after returning to ищет дом'
);

update public.pets
  set status = 'снят с учёта'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'status снят с учёта clears the mark'
);

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt,
  status, needs_treatment_since
) values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Created adopted', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест',
  'пристроен', '2000-01-01 00:00:00+00'
);

select is(
  (select needs_treatment_since from public.pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  null::timestamptz,
  'animal created as пристроен has no mark'
);

update public.pets
  set status = 'ищет дом', needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    update public.pets
      set status = 'пристроен'
      where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  $$,
  'volunteer can change status to пристроен'
);

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'mark is cleared under the volunteer role'
);

select * from finish();

rollback;