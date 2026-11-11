-- Откат: убирает реквизиты и текст о пожертвованиях у приютов.
-- Внимание: значения payment_url, paypal_email и donation_text будут потеряны безвозвратно.
alter table public.shelters
  drop constraint if exists shelters_payment_url_check,
  drop constraint if exists shelters_paypal_email_check,
  drop constraint if exists shelters_donation_text_length;

alter table public.shelters
  drop column if exists payment_url,
  drop column if exists paypal_email,
  drop column if exists donation_text;
