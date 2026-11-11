begin;

select plan(3);

select lives_ok(
  $$ insert into public.shelters (slug, name, about) values ('about-3000', 'About 3000', repeat('a', 3000)) $$,
  'about of 3000 characters is accepted'
);

select throws_ok(
  $$ insert into public.shelters (slug, name, about) values ('about-3001', 'About 3001', repeat('a', 3001)) $$,
  '23514',
  null,
  'about over 3000 characters is rejected'
);

select lives_ok(
  $$ insert into public.shelters (slug, name, about) values ('about-empty', 'About empty', null) $$,
  'empty about is accepted'
);

select * from finish();

rollback;
