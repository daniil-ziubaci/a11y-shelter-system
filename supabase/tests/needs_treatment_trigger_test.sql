begin;

select plan(14);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Trigger', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);

select has_trigger(
  'public', 'pets', 'pets_set_needs_treatment_since',
  'trigger exists on pets'
);

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'new animal has no mark'
);

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since = now() from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  true,
  'switching on sets current time, not the sent date'
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
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'sent date is ignored while mark is on'
);

update public.pets
  set name = 'Renamed'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2026-01-01 00:00:00+00'::timestamptz,
  'update of another column keeps the date'
);

update public.pets
  set needs_treatment_since = null
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'switching off clears the date'
);

update public.pets
  set needs_treatment_since = '2000-01-01 00:00:00+00'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_since = now() from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  true,
  'switching on again sets current time'
);

update public.pets
  set needs_treatment_since = null
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    update public.pets
      set needs_treatment_since = '2000-01-01 00:00:00+00'
      where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  $$,
  'volunteer can switch the mark on'
);

select is(
  (select needs_treatment_since = now() from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  true,
  'trigger works under the volunteer role'
);

select lives_ok(
  $$
    update public.pets
      set needs_treatment_since = null
      where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  $$,
  'volunteer can switch the mark off'
);

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null::timestamptz,
  'mark is cleared under the volunteer role'
);

reset role;

select lives_ok(
  $$
    insert into public.pets (
      id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt,
      needs_treatment_since
    ) values (
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Created marked', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
      '2000-01-01 00:00:00+00'
    )
  $$,
  'animal can be created with the mark on'
);

select is(
  (select needs_treatment_since = now() from public.pets where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  true,
  'created animal gets current time, not the sent date'
);

select * from finish();

rollback;