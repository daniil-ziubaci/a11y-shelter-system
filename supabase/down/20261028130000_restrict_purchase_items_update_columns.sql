-- После отката волонтёр снова может менять любую колонку позиции напрямую, в том числе остаток в обход журнала закупок. Данные не затрагиваются.
revoke update (name, category) on public.purchase_items from authenticated;
grant update on public.purchase_items to authenticated;