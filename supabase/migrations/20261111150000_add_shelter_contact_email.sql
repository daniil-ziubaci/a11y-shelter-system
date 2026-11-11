alter table public.shelters
  add column contact_email text;

alter table public.shelters
  add constraint shelters_contact_email_check
  check ((contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') and (char_length(contact_email) <= 100));
