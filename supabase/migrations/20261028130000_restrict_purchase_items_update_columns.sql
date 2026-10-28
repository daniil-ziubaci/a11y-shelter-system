-- Волонтёр может менять в позиции только название и категорию. Остаток меняется только функциями receive_purchase и undo_purchase (они пишут журнал), единицу и приют менять нельзя.

revoke update on public.purchase_items from anon, authenticated;
grant update (name, category) on public.purchase_items to authenticated;