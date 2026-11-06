begin;

select plan(5);

select has_column('public', 'volunteer_pets', 'review_rank', 'volunteer_pets has review_rank');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

alter table public.pets disable trigger user;

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt,
  status, status_changed_at, needs_treatment_since
) values
  ('d1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Pending only', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'в процессе', now() - interval '10 days', null),
  ('d2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Looking with mark', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'ищет дом', now() - interval '30 days', now() - interval '5 days'),
  ('d3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Treatment status', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'на лечении', now() - interval '3 days', null),
  ('d4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Pending with mark', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест',
   'в процессе', now() - interval '10 days', now() - interval '2 days');

select is(
  (select review_rank from public.volunteer_pets where id = 'd1111111-1111-1111-1111-111111111111'),
  1,
  'pending without a mark is rank 1'
);

select is(
  (select review_rank from public.volunteer_pets where id = 'd2222222-2222-2222-2222-222222222222'),
  0,
  'a treatment mark makes rank 0'
);

select is(
  (select review_rank from public.volunteer_pets where id = 'd3333333-3333-3333-3333-333333333333'),
  0,
  'treatment status is rank 0'
);

select is(
  (select review_rank from public.volunteer_pets where id = 'd4444444-4444-4444-4444-444444444444'),
  0,
  'pending with a mark is rank 0'
);

select * from finish();

rollback;
