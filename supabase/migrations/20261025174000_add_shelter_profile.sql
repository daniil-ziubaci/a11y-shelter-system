-- Профиль и контакт приюта. Задаются только координатором (у волонтёров права на запись в shelters нет).

alter table public.shelters
  add column contact_phone text constraint shelters_contact_phone_format check (contact_phone ~ '^\+?[0-9 ()-]{5,20}$'),
  add column contact_messenger text constraint shelters_contact_messenger_https check (contact_messenger ~ '^https://'),
  add column city text,
  add column address text,
  add column contact_hours text,
  add column about text constraint shelters_about_length check (char_length(about) <= 1000),
  add column founded_year integer constraint shelters_founded_year_range check (founded_year between 1800 and 2100),
  add column legal_info text,
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

revoke all on public.shelters from anon, authenticated;
grant select on public.shelters to anon, authenticated;