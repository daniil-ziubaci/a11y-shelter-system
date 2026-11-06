begin;

select plan(10);

select has_column('public', 'shelters', 'instagram_url', 'instagram_url column exists');

select has_column('public', 'shelters', 'viber_url', 'viber_url column exists');

select has_column('public', 'shelters', 'telegram_url', 'telegram_url column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111');

insert into public.shelters (id, slug, name, instagram_url) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', 'https://instagram.com/shelter');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$ insert into public.shelters (slug, name, viber_url, telegram_url) values ('shelter-b', 'Shelter B', 'https://invite.viber.com/x', 'https://t.me/shelter') $$,
  'https links are accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, telegram_url) values ('shelter-c', 'Shelter C', 'http://t.me/shelter') $$,
  '23514',
  null,
  'link without https is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, instagram_url) values ('shelter-d', 'Shelter D', 'javascript:alert(1)') $$,
  '23514',
  null,
  'executable link is rejected'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, viber_url) values ('shelter-e', 'Shelter E', 'https://' || repeat('a', 293)) $$,
  '23514',
  null,
  'link of 301 characters is rejected'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select instagram_url from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'https://instagram.com/shelter',
  'anonymous can read instagram_url'
);

select throws_ok(
  $$ update public.shelters set instagram_url = 'https://evil.example' $$,
  '42501',
  null,
  'anonymous cannot update shelters'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok(
  $$ update public.shelters set instagram_url = 'https://evil.example' $$,
  '42501',
  null,
  'volunteer cannot update instagram_url'
);

select * from finish();
