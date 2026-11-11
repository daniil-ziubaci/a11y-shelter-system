alter table public.shelters
  add column facebook_url text,
  add column whatsapp_url text;

alter table public.shelters
  add constraint shelters_facebook_url_check
  check ((facebook_url ~ '^https://') and (char_length(facebook_url) <= 300));

alter table public.shelters
  add constraint shelters_whatsapp_url_check
  check ((whatsapp_url ~ '^https://') and (char_length(whatsapp_url) <= 300));
