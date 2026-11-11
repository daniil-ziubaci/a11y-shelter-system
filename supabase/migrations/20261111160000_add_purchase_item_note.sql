alter table public.purchase_items
  add column note text;

alter table public.purchase_items
  add constraint purchase_items_note_check
  check (length(btrim(note)) between 1 and 300);

grant update (note) on table public.purchase_items to authenticated;
