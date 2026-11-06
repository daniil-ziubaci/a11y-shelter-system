begin;

select plan(5);

select has_column('public', 'volunteer_pets', 'review_since', 'volunteer_pets has review_since');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

alter table public.pets disable trigger user;

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt,
  status, status_changed_at, needs_treatment_since
) values
  ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Pending old', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'в процессе', now() - interval '10 days', null),
  ('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Looking with mark', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'ищет дом', now() - interval '30 days', now() - interval '5 days'),
  ('d3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Treatment both', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'на лечении', now() - interval '3 days', now() - interval '8 days'),
  ('d4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Looking quiet', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'ищет дом', now() - interval '30 days', null);

select is(
  (select review_since from public.volunteer_pets where id = 'd1111111-1111-1111-1111-111111111111'),
  now() - interval '10 days',
  'pending status uses the status date'
);

select is(
  (select review_since from public.volunteer_pets where id = 'd2222222-2222-2222-2222-222222222222'),
  now() - interval '5 days',
  'looking for home uses only the treatment mark date'
);

select is(
  (select review_since from public.volunteer_pets where id = 'd3333333-3333-3333-3333-333333333333'),
  now() - interval '8 days',
  'the earlier of the two dates wins'
);

select is(
  (select review_since from public.volunteer_pets where id = 'd4444444-4444-4444-4444-444444444444'),
  null,
  'no review reason gives null'
);

select * from finish();

rollback;
