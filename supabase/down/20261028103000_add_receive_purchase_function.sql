-- После отката функция приёмки товара удаляется. Уже записанные ею остатки в purchase_items не меняются и не откатываются.
drop function public.receive_purchase(uuid, numeric);