begin;

select plan(24);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

insert into public.pets (name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt)
values ('Pet', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест');
insert into public.projects (title, description) values ('Проект', 'Описание');
insert into public.purchase_items (name, category, unit, remaining) values ('Корм', 'корм', 'кг', 3);
insert into public.gallery_photos (source_name, path, thumb_path, alt) values ('01.jpg', '/g/01.webp', '/g/01-thumb.webp', 'Двор');

set local role anon;
set local request.jwt.claims to '{}';

select is((select public.is_site_published()), false, 'without a shelter row the site is not published');
select is((select count(*)::int from public.pets), 0, 'without a shelter row guests see no pets');

reset role;
insert into public.shelter (name) values ('Shelter A');

set local role anon;
set local request.jwt.claims to '{}';

select is((select count(*)::int from public.shelter), 0, 'guests do not see the hidden shelter');
select is((select count(*)::int from public.pets), 0, 'guests do not see pets of the hidden shelter');
select is((select count(*)::int from public.projects), 0, 'guests do not see projects of the hidden shelter');
select is((select count(*)::int from public.purchase_items), 0, 'guests do not see needs of the hidden shelter');
select is((select count(*)::int from public.gallery_photos), 0, 'guests do not see the gallery of the hidden shelter');

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is((select count(*)::int from public.pets), 0, 'non-volunteer does not see pets of the hidden shelter');
select is((select count(*)::int from public.projects), 0, 'non-volunteer does not see projects of the hidden shelter');
select is((select count(*)::int from public.purchase_items), 0, 'non-volunteer does not see needs of the hidden shelter');

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal1"}';

select is((select count(*)::int from public.shelter), 1, 'volunteer sees the hidden shelter');
select is((select count(*)::int from public.pets), 1, 'volunteer sees pets of the hidden shelter');
select is((select count(*)::int from public.projects), 1, 'volunteer sees projects of the hidden shelter');
select is((select count(*)::int from public.purchase_items), 1, 'volunteer sees needs of the hidden shelter');
select is((select count(*)::int from public.gallery_photos), 1, 'volunteer sees the gallery of the hidden shelter');

reset role;
update public.shelter set is_published = true;

set local role anon;
set local request.jwt.claims to '{}';

select is((select public.is_site_published()), true, 'is_site_published follows the shelter row');
select is((select count(*)::int from public.shelter), 1, 'guests see the published shelter');
select is((select count(*)::int from public.pets), 1, 'guests see pets of the published shelter');
select is((select count(*)::int from public.projects), 1, 'guests see projects of the published shelter');
select is((select count(*)::int from public.purchase_items), 1, 'guests see needs of the published shelter');
select is((select count(*)::int from public.gallery_photos), 1, 'guests see the gallery of the published shelter');
select throws_ok($$ select * from public.volunteers $$, '42501', null, 'guests cannot read the volunteer list');

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is((select count(*)::int from public.volunteers), 0, 'non-volunteer sees no volunteer entries');
select throws_ok(
  $$ delete from public.volunteers $$,
  '42501', null, 'logged-in user cannot remove volunteers'
);

select * from finish();

rollback;
