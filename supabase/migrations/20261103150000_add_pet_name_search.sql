create function public.translit_ru(input text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(string_agg(coalesce(m.latin, c.letter), '' order by c.idx), '')
  from regexp_split_to_table(
    lower(translate(
      input,
      'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
      'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
    )),
    ''
  ) with ordinality as c(letter, idx)
  left join (
    values
      ('а', 'a'), ('б', 'b'), ('в', 'v'), ('г', 'g'), ('д', 'd'), ('е', 'e'),
      ('ё', 'yo'), ('ж', 'zh'), ('з', 'z'), ('и', 'i'), ('й', 'y'), ('к', 'k'),
      ('л', 'l'), ('м', 'm'), ('н', 'n'), ('о', 'o'), ('п', 'p'), ('р', 'r'),
      ('с', 's'), ('т', 't'), ('у', 'u'), ('ф', 'f'), ('х', 'kh'), ('ц', 'ts'),
      ('ч', 'ch'), ('ш', 'sh'), ('щ', 'shch'), ('ъ', ''), ('ы', 'y'), ('ь', ''),
      ('э', 'e'), ('ю', 'yu'), ('я', 'ya')
  ) as m(cyrillic, latin) on m.cyrillic = c.letter
$$;

alter table public.pets
  add column name_search text generated always as (name || '|' || public.translit_ru(name)) stored;
