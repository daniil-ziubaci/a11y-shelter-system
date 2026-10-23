-- Откат удаления колонки: колонка возвращается пустой.
-- Данные, которые были в ней до удаления, восстановить нельзя.
alter table pets
  add column short_description text not null default ''
  check (char_length(short_description) <= 160);