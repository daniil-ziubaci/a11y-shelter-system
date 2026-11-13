begin;

select plan(11);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (name, is_published) values ('Shelter A', true);
insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into storage.objects (bucket_id, name) values
  ('pet-photos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/1/photo.jpg');

select is(
  (select public from storage.buckets where id = 'pet-photos'),
  true,
  'pet-photos bucket is public'
);

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'animals/1/photo.webp') $$,
  'volunteer can upload an animal photo'
);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'projects/1.webp') $$,
  'volunteer can upload a project photo'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'brand/logo.png') $$,
  '42501', null, 'volunteer cannot upload into the brand folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'photo.jpg') $$,
  '42501', null, 'volunteer cannot upload outside the photo folders'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/2/photo.jpg') $$,
  '42501', null, 'volunteer cannot add files to the folders of the old site'
);

set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'animals/3/photo.webp') $$,
  '42501', null, 'non-volunteer cannot upload'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('pet-photos', 'animals/4/photo.webp') $$,
  '42501', null, 'volunteer without second factor cannot upload'
);

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select lives_ok(
  $$ update storage.objects set name = name || 'x' where bucket_id = 'pet-photos' $$,
  'volunteer update of files does not raise an error'
);

select is(
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd in ('UPDATE', 'DELETE', 'ALL')),
  0::bigint,
  'no update or delete policies on storage objects'
);

reset role;

select is(
  (select count(*) from storage.objects where name in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/animals/1/photo.jpg',
    'animals/1/photo.webp'
  )),
  2::bigint,
  'files are neither renamed nor deleted by volunteers'
);

select * from finish();

rollback;
