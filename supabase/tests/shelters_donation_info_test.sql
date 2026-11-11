begin;

select plan(11);

select has_column('public', 'shelters', 'payment_url', 'payment_url column exists');

select has_column('public', 'shelters', 'paypal_email', 'paypal_email column exists');

select has_column('public', 'shelters', 'donation_text', 'donation_text column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, payment_url) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'https://pay.example/a');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.shelters (slug, name, payment_url, paypal_email, donation_text) values ('shelter-b', 'Shelter B', 'https://pay.example/b', 'help@example.org', 'Thank you') $$,
  'valid donation info is accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, payment_url) values ('shelter-c', 'Shelter C', 'http://pay.example/c') $$,
  '23514',
  null,
  'payment link without https is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, payment_url) values ('shelter-d', 'Shelter D', 'https://' || repeat('a', 293)) $$,
  '23514',
  null,
  'payment link of 301 characters is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, paypal_email) values ('shelter-e', 'Shelter E', 'not-an-email') $$,
  '23514',
  null,
  'malformed paypal email is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, donation_text) values ('shelter-f', 'Shelter F', repeat('a', 501)) $$,
  '23514',
  null,
  'donation text of 501 characters is rejected'
);

update public.shelters set is_published = true;

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select payment_url from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'https://pay.example/a',
  'anonymous can read payment_url'
);

select throws_ok(
  $$ update public.shelters set payment_url = 'https://evil.example' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set payment_url = 'https://evil.example' $$,
  '42501',
  null,
  'volunteer cannot update payment_url'
);

select * from finish();
