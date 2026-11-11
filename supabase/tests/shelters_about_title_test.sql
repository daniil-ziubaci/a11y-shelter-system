begin;
select plan(7);

select has_column('public', 'shelters', 'about_title', 'about_title exists');
select has_column('public', 'shelters', 'about_title_en', 'about_title_en exists');
select has_column('public', 'shelters', 'about_title_ro', 'about_title_ro exists');
select is(
  (select count(*)::int from pg_constraint
    where conname in ('shelters_about_title_check', 'shelters_about_title_en_check', 'shelters_about_title_ro_check')),
  3,
  'three length checks'
);
select ok(has_column_privilege('anon', 'public.shelters', 'about_title', 'SELECT'), 'guests read about_title');
select ok(has_column_privilege('anon', 'public.shelters', 'about_title_en', 'SELECT'), 'guests read about_title_en');
select ok(has_column_privilege('anon', 'public.shelters', 'about_title_ro', 'SELECT'), 'guests read about_title_ro');

select * from finish();
rollback;
