begin;

select plan(40);

insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333');

insert into public.shelter (
  name, name_en, adoption_info, contact_email, payment_url, whatsapp_url, instagram_url, photo_path, photo_alt, brand_path
) values (
  'Shelter A', 'Shelter A EN', 'Приходите в субботу', 'help@example.org', 'https://pay.example/a',
  'https://wa.me/37379989969', 'https://instagram.com/shelter', 'shelter/photo.webp', 'Двор приюта с вольерами', 'brand/v1'
);

insert into public.volunteers (user_id) values ('11111111-1111-1111-1111-111111111111');

select has_column('public', 'shelter', 'is_published', 'is_published column exists');
select is((select is_published from public.shelter), false, 'a new shelter is hidden by default');

select has_column('public', 'shelter', 'translations', 'shelter has translations column');
select col_type_is('public', 'shelter', 'translations', 'jsonb', 'translations is jsonb');
select col_not_null('public', 'shelter', 'translations', 'translations is not null');
select is((select translations from public.shelter), '{}'::jsonb, 'new shelter starts with empty translations');
select throws_ok($$ update public.shelter set translations = '[]'::jsonb $$, '23514', null, 'array is rejected');
select throws_ok(
  $$ update public.shelter set translations = jsonb_build_object('x', repeat('a', 20001)) $$,
  '23514', null, 'oversized value is rejected'
);
select throws_ok($$ update public.shelter set translations = null $$, '23502', null, 'null is rejected');
select lives_ok(
  $$ update public.shelter set translations = '{"about": {"en": {"text": "Hello", "hash": "abc"}}}'::jsonb $$,
  'valid object is accepted'
);

set local role anon;
set local request.jwt.claims to '{}';

select is((select count(*)::int from public.shelter), 0, 'anonymous does not see a hidden shelter');

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is((select count(*)::int from public.shelter), 0, 'non-volunteer does not see a hidden shelter');

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select is((select count(*)::int from public.shelter), 1, 'volunteer sees the hidden shelter');
select throws_ok($$ update public.shelter set is_published = true $$, '42501', null, 'volunteer cannot publish the shelter');

reset role;
update public.shelter set is_published = true;

set local role anon;
set local request.jwt.claims to '{}';

select is((select count(*)::int from public.shelter), 1, 'anonymous sees the published shelter');
select is((select adoption_info from public.shelter), 'Приходите в субботу', 'anonymous can read adoption_info');
select is((select contact_email from public.shelter), 'help@example.org', 'anonymous can read contact_email');
select is((select payment_url from public.shelter), 'https://pay.example/a', 'anonymous can read payment_url');
select is((select whatsapp_url from public.shelter), 'https://wa.me/37379989969', 'anonymous can read whatsapp_url');
select is((select instagram_url from public.shelter), 'https://instagram.com/shelter', 'anonymous can read instagram_url');
select is((select name_en from public.shelter), 'Shelter A EN', 'anonymous can read name_en');
select is((select photo_alt from public.shelter), 'Двор приюта с вольерами', 'anonymous can read photo_alt');
select lives_ok($$ select translations from public.shelter $$, 'anonymous can read translations');
select throws_ok($$ update public.shelter set adoption_info = 'Взлом' $$, '42501', null, 'anonymous cannot update the shelter');
select throws_ok($$ delete from public.shelter $$, '42501', null, 'anonymous cannot delete the shelter');

set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "aal": "aal2"}';

select is((select count(*)::int from public.shelter), 1, 'non-volunteer sees the published shelter');

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111", "aal": "aal2"}';

select throws_ok($$ update public.shelter set adoption_info = 'Взлом' $$, '42501', null, 'volunteer cannot update adoption_info');
select throws_ok($$ update public.shelter set contact_email = 'evil@example.org' $$, '42501', null, 'volunteer cannot update contact_email');
select throws_ok($$ update public.shelter set payment_url = 'https://evil.example' $$, '42501', null, 'volunteer cannot update payment_url');
select throws_ok($$ update public.shelter set whatsapp_url = 'https://evil.example' $$, '42501', null, 'volunteer cannot update whatsapp_url');
select throws_ok($$ update public.shelter set brand_path = 'evil/brand' $$, '42501', null, 'volunteer cannot update brand_path');
select throws_ok($$ update public.shelter set photo_alt = 'Взлом' $$, '42501', null, 'volunteer cannot update photo_alt');
select throws_ok($$ update public.shelter set translations = '{"hacked": {}}'::jsonb $$, '42501', null, 'volunteer cannot write translations');

reset role;

select ok(has_column_privilege('anon', 'public.shelter', 'content_language', 'select'), 'guest can read the content language');
select ok(has_column_privilege('authenticated', 'public.shelter', 'content_language', 'select'), 'volunteer can read the content language');
select ok(not has_column_privilege('anon', 'public.shelter', 'content_language', 'update'), 'guest cannot change the content language');
select ok(not has_column_privilege('authenticated', 'public.shelter', 'content_language', 'update'), 'volunteer cannot change the content language');
select ok(not has_column_privilege('authenticated', 'public.shelter', 'content_language', 'insert'), 'volunteer cannot set the content language on insert');
select ok(
  has_column_privilege('anon', 'public.shelter', 'about_title', 'select')
    and has_column_privilege('anon', 'public.shelter', 'about_title_en', 'select')
    and has_column_privilege('anon', 'public.shelter', 'about_title_ro', 'select')
    and has_column_privilege('anon', 'public.shelter', 'tiktok_url', 'select'),
  'guest can read about titles and tiktok_url'
);
select ok(has_table_privilege('service_role', 'public.shelter', 'UPDATE'), 'service role (coordinator scripts) can edit the shelter');

select * from finish();

rollback;
