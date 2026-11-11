-- Откат: убирает почту приюта.
-- Внимание: значения contact_email будут потеряны безвозвратно.
alter table public.shelters
  drop constraint if exists shelters_contact_email_check;

alter table public.shelters
  drop column if exists contact_email;
