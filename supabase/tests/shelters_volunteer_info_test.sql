begin;

select plan(6);

select has_column('public', 'shelters', 'volunteer_info', 'volunteer_info column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, currency, volunteer_info) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'MDL', 'Нужны руки по выходным');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$
    insert into public.shelters (slug, name, currency, volunteer_info)
    values ('shelter-b', 'Shelter B', 'MDL', repeat('а', 1000))
  $$,
  'text of 1000 characters is accepted'
);

select throws_ok(
  $$
    insert into public.shelters (slug, name, currency, volunteer_info)
    values ('shelter-c', 'Shelter C', 'MDL', repeat('а', 1001))
  $$,
  '23514',
  null,
  'text of 1001 characters is rejected'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select volunteer_info from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Нужны руки по выходным',
  'anonymous can read volunteer_info'
);

select throws_ok(
  $$ update public.shelters set volunteer_info = 'Взлом' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set volunteer_info = 'Взлом' $$,
  '42501',
  null,
  'volunteer cannot update volunteer_info'
);

select * from finish();
rollback;
