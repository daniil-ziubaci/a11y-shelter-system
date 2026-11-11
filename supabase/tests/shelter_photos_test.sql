begin;
select plan(11);

select has_table('public', 'shelter_photos', 'table shelter_photos exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.shelter_photos'::regclass),
  true,
  'row level security is on'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'shelter_photos'),
  1,
  'one policy'
);
select ok(has_table_privilege('anon', 'public.shelter_photos', 'SELECT'), 'guests can read');
select ok(not has_table_privilege('anon', 'public.shelter_photos', 'INSERT'), 'guests cannot insert');
select ok(has_table_privilege('authenticated', 'public.shelter_photos', 'SELECT'), 'volunteers can read');
select ok(not has_table_privilege('authenticated', 'public.shelter_photos', 'INSERT'), 'volunteers cannot insert');
select ok(not has_table_privilege('authenticated', 'public.shelter_photos', 'UPDATE'), 'volunteers cannot update');
select ok(not has_table_privilege('authenticated', 'public.shelter_photos', 'DELETE'), 'volunteers cannot delete');
select ok(has_table_privilege('service_role', 'public.shelter_photos', 'INSERT'), 'service role can insert');
select is(
  (select count(*)::int from pg_constraint where conrelid = 'public.shelter_photos'::regclass and contype = 'c'),
  7,
  'seven check constraints'
);

select * from finish();
rollback;
