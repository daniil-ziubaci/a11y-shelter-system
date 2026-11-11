alter table public.shelters
  add column payment_url text,
  add column paypal_email text,
  add column donation_text text;

alter table public.shelters
  add constraint shelters_payment_url_check
  check ((payment_url ~ '^https://') and (char_length(payment_url) <= 300));

alter table public.shelters
  add constraint shelters_paypal_email_check
  check ((paypal_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') and (char_length(paypal_email) <= 100));

alter table public.shelters
  add constraint shelters_donation_text_length
  check (char_length(donation_text) <= 500);
