begin;

select plan(10);

select has_column('public', 'shelters', 'facebook_url', 'facebook_url column exists');

select has_column('public', 'shelters', 'whatsapp_url', 'whatsapp_url column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, facebook_url, whatsapp_url) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'https://facebook.com/shelter', 'https://wa.me/37379989969');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.shelters (slug, name, facebook_url, whatsapp_url) values ('shelter-b', 'Shelter B', 'https://facebook.com/b', 'https://wa.me/37300000000') $$,
  'https links are accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, facebook_url) values ('shelter-c', 'Shelter C', 'http://facebook.com/c') $$,
  '23514',
  null,
  'facebook link without https is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, whatsapp_url) values ('shelter-d', 'Shelter D', 'http://wa.me/37300000000') $$,
  '23514',
  null,
  'whatsapp link without https is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, facebook_url) values ('shelter-e', 'Shelter E', 'javascript:alert(1)') $$,
  '23514',
  null,
  'executable link is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, whatsapp_url) values ('shelter-f', 'Shelter F', 'https://' || repeat('a', 293)) $$,
  '23514',
  null,
  'link of 301 characters is rejected'
);

update public.shelters set is_published = true;

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select whatsapp_url from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'https://wa.me/37379989969',
  'anonymous can read whatsapp_url'
);

select throws_ok(
  $$ update public.shelters set facebook_url = 'https://evil.example' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set whatsapp_url = 'https://evil.example' $$,
  '42501',
  null,
  'volunteer cannot update whatsapp_url'
);

select * from finish();
