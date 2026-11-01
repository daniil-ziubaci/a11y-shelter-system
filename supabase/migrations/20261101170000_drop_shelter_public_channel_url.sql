alter table public.shelters drop constraint if exists shelters_profile_text_length;

alter table public.shelters drop column if exists public_channel_url;

alter table public.shelters
  add constraint shelters_profile_text_length check (
    char_length(city) <= 100
    and char_length(address) <= 200
    and char_length(contact_hours) <= 200
    and char_length(legal_info) <= 500
    and char_length(contact_messenger) <= 300
  );
