-- Откат: убирает примечания у позиций списка нужд.
-- Внимание: значения note будут потеряны безвозвратно.
revoke update (note) on table public.purchase_items from authenticated;

alter table public.purchase_items
  drop constraint if exists purchase_items_note_check;

alter table public.purchase_items
  drop column if exists note;
