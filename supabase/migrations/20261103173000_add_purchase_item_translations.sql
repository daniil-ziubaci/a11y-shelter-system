alter table public.purchase_items
  add column translations jsonb not null default '{}'::jsonb
  constraint purchase_items_translations_check check (
    jsonb_typeof(translations) = 'object'
    and octet_length(translations::text) <= 20000
  );

grant update (translations) on public.purchase_items to authenticated;
