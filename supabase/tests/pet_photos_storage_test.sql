begin;

select plan(8);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shelter-b', 'Shelter B');

insert into public.shelter_members (user_id, shelter_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

insert into storage.objects (bucket_id, name) values
  ('pet-photos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/animals/1/photo.jpg');

set local role authenticated;

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name) values
      ('pet-photos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/1/photo.jpg')
  $$,
  'member can upload to own shelter folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name) values
      ('pet-photos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/animals/2/photo.jpg')
  $$,
  '42501',
  null,
  'member cannot upload to other shelter folder'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name) values
      ('pet-photos', 'photo.jpg')
  $$,
  '42501',
  null,
  'member cannot upload outside any shelter folder'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name) values
      ('pet-photos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/3/photo.jpg')
  $$,
  '42501',
  null,
  'non-member cannot upload to any shelter folder'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name) values
      ('pet-photos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/4/photo.jpg')
  $$,
  '42501',
  null,
  'member without second factor cannot upload'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$
    update storage.objects
      set name = name || 'x'
      where bucket_id = 'pet-photos'
  $$,
  'member update of files does not raise an error'
);

select is(
  (select count(*) from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd in ('UPDATE', 'DELETE', 'ALL')),
  0::bigint,
  'no update or delete policies on storage objects'
);

reset role;

select is(
  (select count(*) from storage.objects where name in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/1/photo.jpg',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/animals/1/photo.jpg'
  )),
  2::bigint,
  'files are neither renamed nor deleted by members'
);

select * from finish();

rollback;