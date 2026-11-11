begin;

select plan(8);

select has_column('public', 'shelters', 'is_published', 'is_published column exists');

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.shelters (id, slug, name, is_published) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A', true);

insert into public.shelters (id, slug, name) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

select is(
  (select is_published from public.shelters where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  false,
  'new shelter is hidden by default'
);

set local role anon;

set local request.jwt.claims to '{}';

select is(
  (select count(*)::int from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'anonymous sees a published shelter'
);

select is(
  (select count(*)::int from public.shelters where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'anonymous does not see a hidden shelter'
);

set local role authenticated;

set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222", "aal": "aal2"}';

select is(
  (select count(*)::int from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'non-member sees a published shelter'
);

select is(
  (select count(*)::int from public.shelters where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'non-member does not see a hidden shelter'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is(
  (select count(*)::int from public.shelters where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'member sees their own hidden shelter'
);

select throws_ok(
  $$ update public.shelters set is_published = true $$,
  '42501',
  null,
  'volunteer cannot publish a shelter'
);

select * from finish();
