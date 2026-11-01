-- Откат: убирает индекс порядка каталога и колонку status_rank.
-- Данные не теряются: значение вычисляется из status и появится снова при повторном применении миграции.
drop index public.pets_catalog_order_idx;
alter table public.pets drop column status_rank;
