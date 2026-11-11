begin;
select plan(5);

select has_column('public', 'shelters', 'tiktok_url', 'column tiktok_url exists');
select col_type_is('public', 'shelters', 'tiktok_url', 'text', 'tiktok_url is text');
select col_is_null('public', 'shelters', 'tiktok_url', 'tiktok_url is optional');
select is(
  (select count(*)::int from pg_constraint where conname = 'shelters_tiktok_url_check'),
  1,
  'tiktok_url check exists'
);
select ok(
  has_column_privilege('anon', 'public.shelters', 'tiktok_url', 'SELECT'),
  'guests can read tiktok_url'
);

select * from finish();
rollback;
