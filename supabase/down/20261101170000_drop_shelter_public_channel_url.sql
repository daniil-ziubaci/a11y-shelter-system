-- После отката колонка public_channel_url возвращается пустой: значения, которые были в ней до удаления, не восстанавливаются.
alter table public.shelters drop constraint if exists shelters_profile_text_length;

alter table public.shelters
  add column public_channel_url text constraint shelters_public_channel_url_https check (public_channel_url ~ '^https://');

alter table public.shelters
  add constraint shelters_profile_text_length check (
    char_length(city) <= 100
    and char_length(address) <= 200
    and char_length(contact_hours) <= 200
    and char_length(legal_info) <= 500
    and char_length(contact_messenger) <= 300
    and char_length(public_channel_url) <= 300
  );
