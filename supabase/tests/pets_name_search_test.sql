begin;

select plan(14);

select has_function('public', 'translit_ru', array['text'], 'translit_ru exists');

select has_column('public', 'pets', 'name_search', 'pets has name_search column');

select is(public.translit_ru('Барсик'), 'barsik', 'plain name');

select is(public.translit_ru('ЖУК'), 'zhuk', 'capitals');

select is(public.translit_ru('Щёлк'), 'shchyolk', 'shch and yo');

select is(public.translit_ru('Мария-Анна'), 'mariya-anna', 'hyphen is kept');

select is(public.translit_ru('Rex'), 'rex', 'latin is kept and lowercased');

select is(public.translit_ru('Белла 2'), 'bella 2', 'digits and spaces are kept');

select is(public.translit_ru(''), '', 'empty string stays empty');

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

insert into public.pets (
  id, shelter_id, name, species, sex, birth_date, is_age_approximate, health, description, photo_url, photo_alt
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Барсик', 'кошка', 'мальчик', '2024-01-01', false, 'здоров', 'тест', '/test.jpg', 'тест'
);

select is(
  (select name_search from public.pets where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'Барсик|barsik',
  'name_search holds the name and its transliteration'
);

select is(
  (select count(*) from public.pets where name_search ilike '%BARSIK%'),
  1::bigint,
  'latin search finds the name regardless of case'
);

select is(
  (select count(*) from public.pets where name_search ilike '%барс%'),
  1::bigint,
  'cyrillic search still finds the name'
);

update public.pets set name = 'Жук' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select is(
  (select name_search from public.pets where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'Жук|zhuk',
  'name_search follows the name'
);

select throws_ok(
  $$ update public.pets set name_search = 'x' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '428C9',
  null,
  'name_search cannot be written directly'
);

select * from finish();

rollback;
