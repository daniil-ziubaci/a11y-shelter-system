-- Откат: возвращает обязательность поля diet.
-- Животным без питания подставляется текст 'не указано', иначе возврат
-- ограничения упал бы на пустых значениях. Прежнее состояние пустых полей
-- восстановить нельзя.
update public.pets set diet = 'не указано' where diet is null;
alter table public.pets alter column diet set not null;