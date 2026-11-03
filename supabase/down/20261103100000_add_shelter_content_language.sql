-- После отката теряется язык, на котором приют вводит свои тексты: колонка удаляется вместе с правилом допустимых значений.
alter table public.shelters
  drop column content_language;
