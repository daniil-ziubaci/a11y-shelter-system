-- После отката данные профиля и контакта приюта теряются: колонки удаляются вместе с правилами.

alter table public.shelters
  drop column contact_phone,
  drop column contact_messenger,
  drop column city,
  drop column address,
  drop column contact_hours,
  drop column about,
  drop column founded_year,
  drop column legal_info,
  drop column public_channel_url;