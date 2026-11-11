-- Откат: возвращает прежний лимит текста «О приюте» в 1000 символов.
-- Внимание: если у какого-то приюта about длиннее 1000 символов, откат не выполнится.
-- Сначала сократи такие тексты вручную.
alter table public.shelters
  drop constraint if exists shelters_about_length;

alter table public.shelters
  add constraint shelters_about_length check (char_length(about) <= 1000);
