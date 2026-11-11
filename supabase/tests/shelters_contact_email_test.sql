begin;

select plan(7);

select has_column('public', 'shelters', 'contact_email', 'contact_email column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, contact_email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'help@example.org');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.shelters (slug, name, contact_email) values ('shelter-b', 'Shelter B', 'info@example.org') $$,
  'valid email is accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, contact_email) values ('shelter-c', 'Shelter C', 'not-an-email') $$,
  '23514',
  null,
  'malformed email is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, contact_email) values ('shelter-d', 'Shelter D', 'a@' || repeat('b', 98) || '.c') $$,
  '23514',
  null,
  'email of 102 characters is rejected'
);

update public.shelters set is_published = true;

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select contact_email from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'help@example.org',
  'anonymous can read contact_email'
);

select throws_ok(
  $$ update public.shelters set contact_email = 'evil@example.org' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set contact_email = 'evil@example.org' $$,
  '42501',
  null,
  'volunteer cannot update contact_email'
);

select * from finish();
