begin;

select plan(75);

insert into public.shelter (name) values ('Shelter A');

select has_table('public', 'shelter', 'table shelter exists');
select hasnt_table('public', 'shelters', 'old multi-shelter table is gone');
select hasnt_column('public', 'shelter', 'slug', 'no slug: the shelter is not part of any address');
select hasnt_column('public', 'shelter', 'public_channel_url', 'public_channel_url column is gone');
select hasnt_column('public', 'shelter', 'volunteer_info', 'volunteer_info column is gone');

select throws_ok(
  $$ insert into public.shelter (name) values ('Shelter B') $$,
  '23505',
  null,
  'a second shelter row is rejected'
);

select throws_ok(
  $$ insert into public.shelter (id, name) values (false, 'Shelter B') $$,
  '23514',
  null,
  'a row with another key is rejected'
);

select throws_ok(
  $$ update public.shelter set id = false $$,
  '23514',
  null,
  'the key of the row cannot be changed'
);

select is((select count(*)::int from public.shelter), 1, 'there is exactly one shelter row');

select throws_ok($$ update public.shelter set name = '  ' $$, '23514', null, 'blank name is rejected');
select throws_ok($$ update public.shelter set name = repeat('a', 151) $$, '23514', null, 'name of 151 characters is rejected');

select lives_ok($$ update public.shelter set about = repeat('a', 3000) $$, 'about of 3000 characters is accepted');
select throws_ok($$ update public.shelter set about = repeat('a', 3001) $$, '23514', null, 'about over 3000 characters is rejected');
select lives_ok($$ update public.shelter set about = null $$, 'empty about is accepted');

select has_column('public', 'shelter', 'about_title', 'about_title exists');
select has_column('public', 'shelter', 'about_title_en', 'about_title_en exists');
select has_column('public', 'shelter', 'about_title_ro', 'about_title_ro exists');
select is(
  (select count(*)::int from pg_constraint
    where conname in ('shelter_about_title_check', 'shelter_about_title_en_check', 'shelter_about_title_ro_check')),
  3,
  'three length checks for about titles'
);
select throws_ok($$ update public.shelter set about_title_ro = repeat('a', 201) $$, '23514', null, 'about title of 201 characters is rejected');

select has_column('public', 'shelter', 'adoption_info', 'adoption_info column exists');
select lives_ok($$ update public.shelter set adoption_info = repeat('а', 1000) $$, 'adoption text of 1000 characters is accepted');
select throws_ok($$ update public.shelter set adoption_info = repeat('а', 1001) $$, '23514', null, 'adoption text of 1001 characters is rejected');

select has_column('public', 'shelter', 'contact_email', 'contact_email column exists');
select lives_ok($$ update public.shelter set contact_email = 'info@example.org' $$, 'valid email is accepted');
select throws_ok($$ update public.shelter set contact_email = 'not-an-email' $$, '23514', null, 'malformed email is rejected');
select throws_ok($$ update public.shelter set contact_email = 'a@' || repeat('b', 98) || '.c' $$, '23514', null, 'email of 102 characters is rejected');

select has_column('public', 'shelter', 'content_language', 'content_language column exists');
select col_not_null('public', 'shelter', 'content_language', 'content_language is required');
select is((select content_language from public.shelter), 'ru', 'content language is Russian by default');
select lives_ok($$ update public.shelter set content_language = 'ro' $$, 'Romanian is allowed');
select lives_ok($$ update public.shelter set content_language = 'en' $$, 'English is allowed');
select throws_ok($$ update public.shelter set content_language = 'de' $$, '23514', null, 'another language is rejected');
select throws_ok($$ update public.shelter set content_language = null $$, '23502', null, 'empty language is rejected');

select has_column('public', 'shelter', 'payment_url', 'payment_url column exists');
select has_column('public', 'shelter', 'paypal_email', 'paypal_email column exists');
select has_column('public', 'shelter', 'donation_text', 'donation_text column exists');
select lives_ok(
  $$ update public.shelter set payment_url = 'https://pay.example/b', paypal_email = 'help@example.org', donation_text = 'Thank you' $$,
  'valid donation info is accepted'
);
select throws_ok($$ update public.shelter set payment_url = 'http://pay.example/c' $$, '23514', null, 'payment link without https is rejected');
select throws_ok($$ update public.shelter set payment_url = 'https://' || repeat('a', 293) $$, '23514', null, 'payment link of 301 characters is rejected');
select throws_ok($$ update public.shelter set paypal_email = 'not-an-email' $$, '23514', null, 'malformed paypal email is rejected');
select throws_ok($$ update public.shelter set donation_text = repeat('a', 501) $$, '23514', null, 'donation text of 501 characters is rejected');

select has_column('public', 'shelter', 'facebook_url', 'facebook_url column exists');
select has_column('public', 'shelter', 'whatsapp_url', 'whatsapp_url column exists');
select has_column('public', 'shelter', 'instagram_url', 'instagram_url column exists');
select has_column('public', 'shelter', 'viber_url', 'viber_url column exists');
select has_column('public', 'shelter', 'telegram_url', 'telegram_url column exists');
select has_column('public', 'shelter', 'tiktok_url', 'tiktok_url column exists');
select col_type_is('public', 'shelter', 'tiktok_url', 'text', 'tiktok_url is text');
select col_is_null('public', 'shelter', 'tiktok_url', 'tiktok_url is optional');
select lives_ok(
  $$ update public.shelter set facebook_url = 'https://facebook.com/b', whatsapp_url = 'https://wa.me/37300000000',
       viber_url = 'https://invite.viber.com/x', telegram_url = 'https://t.me/shelter', tiktok_url = 'https://tiktok.com/@x' $$,
  'https links are accepted'
);
select throws_ok($$ update public.shelter set facebook_url = 'http://facebook.com/c' $$, '23514', null, 'facebook link without https is rejected');
select throws_ok($$ update public.shelter set whatsapp_url = 'http://wa.me/37300000000' $$, '23514', null, 'whatsapp link without https is rejected');
select throws_ok($$ update public.shelter set telegram_url = 'http://t.me/shelter' $$, '23514', null, 'telegram link without https is rejected');
select throws_ok($$ update public.shelter set instagram_url = 'javascript:alert(1)' $$, '23514', null, 'executable instagram link is rejected');
select throws_ok($$ update public.shelter set facebook_url = 'javascript:alert(1)' $$, '23514', null, 'executable facebook link is rejected');
select throws_ok($$ update public.shelter set viber_url = 'https://' || repeat('a', 293) $$, '23514', null, 'viber link of 301 characters is rejected');
select throws_ok($$ update public.shelter set whatsapp_url = 'https://' || repeat('a', 293) $$, '23514', null, 'whatsapp link of 301 characters is rejected');
select throws_ok($$ update public.shelter set tiktok_url = 'http://tiktok.com/@x' $$, '23514', null, 'tiktok link without https is rejected');

select has_column('public', 'shelter', 'name_en', 'name_en column exists');
select has_column('public', 'shelter', 'name_ro', 'name_ro column exists');
select has_column('public', 'shelter', 'brand_path', 'brand_path column exists');
select lives_ok($$ update public.shelter set name_en = 'Shelter B', name_ro = 'Adapost B', brand_path = 'brand/v1' $$, 'valid names and brand path are accepted');
select throws_ok($$ update public.shelter set name_en = '   ' $$, '23514', null, 'blank name_en is rejected');
select throws_ok($$ update public.shelter set name_ro = repeat('a', 151) $$, '23514', null, 'name_ro of 151 characters is rejected');
select throws_ok($$ update public.shelter set brand_path = '' $$, '23514', null, 'empty brand_path is rejected');

select throws_ok($$ update public.shelter set city = repeat('а', 101) $$, '23514', null, 'city longer than 100 characters is rejected');
select throws_ok($$ update public.shelter set contact_messenger = 'https://' || repeat('a', 293) $$, '23514', null, 'contact_messenger longer than 300 characters is rejected');
select throws_ok($$ update public.shelter set contact_phone = 'позвоните' $$, '23514', null, 'phone with letters is rejected');
select throws_ok($$ update public.shelter set founded_year = 1700 $$, '23514', null, 'founding year before 1800 is rejected');

select has_column('public', 'shelter', 'photo_path', 'photo_path column exists');
select has_column('public', 'shelter', 'photo_alt', 'photo_alt column exists');
select lives_ok($$ update public.shelter set photo_path = 'shelter/photo.webp', photo_alt = 'Двор приюта' $$, 'photo with a description is accepted');
select throws_ok($$ update public.shelter set photo_alt = null $$, '23514', null, 'photo path without description is rejected');
select throws_ok($$ update public.shelter set photo_alt = '' $$, '23514', null, 'empty description is rejected');
select throws_ok($$ update public.shelter set photo_alt = repeat('а', 301) $$, '23514', null, 'description of 301 characters is rejected');

select * from finish();

rollback;
