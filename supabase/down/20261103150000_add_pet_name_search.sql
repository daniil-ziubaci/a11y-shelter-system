-- После отката поиск по латинскому написанию имени перестаёт работать: колонка и функция удаляются, сами имена животных не меняются.
alter table public.pets
  drop column name_search;

drop function public.translit_ru(text);
