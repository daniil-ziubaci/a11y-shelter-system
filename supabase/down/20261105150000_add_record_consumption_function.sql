-- Откат: удаляет функцию расхода record_consumption.
-- Данные не теряются: функция только меняла остаток в purchase_items, своей таблицы у неё нет.
drop function if exists public.record_consumption(uuid, numeric);
