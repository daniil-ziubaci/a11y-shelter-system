begin;

select plan(12);

insert into public.shelters (id, slug, name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'shelter-a', 'Shelter A');

select has_column('public', 'shelters', 'content_language', 'колонка content_language есть');

select col_not_null('public', 'shelters', 'content_language', 'content_language обязателен');

select is(
  (select content_language from public.shelters where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'ru',
  'по умолчанию язык контента русский'
);

select lives_ok(
  $$update public.shelters set content_language = 'ro' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'румынский допустим'
);

select lives_ok(
  $$update public.shelters set content_language = 'en' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'английский допустим'
);

select throws_ok(
  $$update public.shelters set content_language = 'de' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '23514',
  null,
  'другой язык отклоняется'
);

select throws_ok(
  $$update public.shelters set content_language = null where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '23502',
  null,
  'пустое значение отклоняется'
);

select ok(
  has_column_privilege('anon', 'public.shelters', 'content_language', 'select'),
  'посетитель может читать язык контента'
);

select ok(
  has_column_privilege('authenticated', 'public.shelters', 'content_language', 'select'),
  'волонтёр может читать язык контента'
);

select ok(
  not has_column_privilege('anon', 'public.shelters', 'content_language', 'update'),
  'посетитель не может менять язык контента'
);

select ok(
  not has_column_privilege('authenticated', 'public.shelters', 'content_language', 'update'),
  'волонтёр не может менять язык контента'
);

select ok(
  not has_column_privilege('authenticated', 'public.shelters', 'content_language', 'insert'),
  'волонтёр не может задать язык контента при вставке'
);

select * from finish();

rollback;
