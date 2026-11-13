begin;

select plan(14);

select has_table('public', 'gallery_photos', 'table gallery_photos exists');
select hasnt_table('public', 'shelter_photos', 'old shelter_photos table is gone');
select is(
  (select relrowsecurity from pg_class where oid = 'public.gallery_photos'::regclass),
  true,
  'row level security is on'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'gallery_photos'),
  1,
  'one policy'
);
select ok(has_table_privilege('anon', 'public.gallery_photos', 'SELECT'), 'guests can read');
select ok(not has_table_privilege('anon', 'public.gallery_photos', 'INSERT'), 'guests cannot insert');
select ok(has_table_privilege('authenticated', 'public.gallery_photos', 'SELECT'), 'volunteers can read');
select ok(not has_table_privilege('authenticated', 'public.gallery_photos', 'INSERT'), 'volunteers cannot insert');
select ok(not has_table_privilege('authenticated', 'public.gallery_photos', 'UPDATE'), 'volunteers cannot update');
select ok(not has_table_privilege('authenticated', 'public.gallery_photos', 'DELETE'), 'volunteers cannot delete');
select ok(has_table_privilege('service_role', 'public.gallery_photos', 'INSERT'), 'service role can insert');
select is(
  (select count(*)::int from pg_constraint where conrelid = 'public.gallery_photos'::regclass and contype = 'c'),
  7,
  'seven check constraints'
);

insert into public.shelter (name) values ('Shelter A');
insert into public.gallery_photos (source_name, path, thumb_path, alt) values
  ('01.jpg', '/gallery/01.webp', '/gallery/01-thumb.webp', 'Двор');

select throws_ok(
  $$ insert into public.gallery_photos (source_name, path, thumb_path, alt) values ('01.jpg', '/gallery/x.webp', '/gallery/x-thumb.webp', 'Двор') $$,
  '23505', null, 'source file name is unique'
);

set local role anon;
set local request.jwt.claims to '{}';

select is((select count(*)::int from public.gallery_photos), 0, 'guests do not see the gallery of a hidden shelter');

select * from finish();

rollback;
