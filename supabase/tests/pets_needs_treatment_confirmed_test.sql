begin;

select plan(7);

select has_column('public', 'pets', 'needs_treatment_confirmed_at', 'confirmation column exists');

insert into public.shelters (id, slug, name, currency) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate,
  weight, diet, health, description, photo_url, photo_alt, needs_treatment_since
) values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Pet A', 'кошка', 'мальчик', '2024-01-01', false, 4,
  'сухой корм', 'здоров', 'тест', '/test.jpg', 'тест', now()
);

select is(
  (select needs_treatment_confirmed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null,
  'a new mark is not confirmed'
);

update public.pets
set needs_treatment_confirmed_at = '2000-01-01'
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_confirmed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  now(),
  'confirming stores the database time, not the client value'
);

alter table public.pets disable trigger pets_touch_needs_treatment_confirmed_at;

update public.pets
set needs_treatment_confirmed_at = '2000-01-01'
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

alter table public.pets enable trigger pets_touch_needs_treatment_confirmed_at;

update public.pets
set name = 'Renamed'
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_confirmed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  '2000-01-01'::timestamptz,
  'an unrelated update keeps the confirmation'
);

update public.pets
set needs_treatment_since = null
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_confirmed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null,
  'turning the mark off clears the confirmation'
);

update public.pets
set needs_treatment_since = now()
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.pets
set needs_treatment_confirmed_at = now()
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

update public.pets
set status = 'пристроен'
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select is(
  (select needs_treatment_confirmed_at from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null,
  'an adopted pet loses the confirmation'
);

select is(
  (select needs_treatment_since from public.pets where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  null,
  'an adopted pet loses the mark'
);

select * from finish();

rollback;
