begin;

select plan(3);

select hasnt_column('public', 'shelters', 'public_channel_url', 'public_channel_url column is gone');

select throws_ok(
  $$insert into public.shelters (slug, name, currency, city)
    values ('shelter-x', 'Shelter X', 'MDL', repeat('а', 101))$$,
  '23514',
  null,
  'city longer than 100 characters is still rejected'
);

select throws_ok(
  $$insert into public.shelters (slug, name, currency, contact_messenger)
    values ('shelter-y', 'Shelter Y', 'MDL', repeat('a', 301))$$,
  '23514',
  null,
  'contact_messenger longer than 300 characters is still rejected'
);

select * from finish();

rollback;
