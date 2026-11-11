-- Откат: убирает ссылки на Facebook и WhatsApp у приютов.
-- Внимание: значения facebook_url и whatsapp_url будут потеряны безвозвратно.
alter table public.shelters
  drop constraint if exists shelters_facebook_url_check,
  drop constraint if exists shelters_whatsapp_url_check;

alter table public.shelters
  drop column if exists facebook_url,
  drop column if exists whatsapp_url;
