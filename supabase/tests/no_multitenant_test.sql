begin;

select plan(10);

select is(
  (select count(*)::int from information_schema.columns
    where table_schema = 'public' and column_name = 'shelter_id'),
  0,
  'no table or view in public has a shelter_id column'
);

select hasnt_table('public', 'shelter_members', 'shelter_members is gone');
select has_table('public', 'volunteers', 'volunteers table exists');
select col_is_pk('public', 'volunteers', 'user_id', 'a person is a volunteer at most once');

select is(
  (select confdeltype from pg_constraint
    where conrelid = 'public.volunteers'::regclass and contype = 'f'),
  'c',
  'deleting a sign-in user removes the volunteer entry'
);

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'every table in public has row level security'
);

select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
  0,
  'guests have no write privileges on any table'
);

select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated'
      and privilege_type = 'DELETE' and table_name <> 'pet_internal'),
  0,
  'volunteers delete nothing but enclosures'
);

select is(
  (select prosecdef from pg_proc where oid = 'public.is_volunteer()'::regprocedure),
  true,
  'is_volunteer reads the volunteer list regardless of its access rules'
);

select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and not exists (select 1 from unnest(p.proconfig) as c where c like 'search_path=%')),
  0,
  'every security definer function pins search_path'
);

select * from finish();

rollback;
