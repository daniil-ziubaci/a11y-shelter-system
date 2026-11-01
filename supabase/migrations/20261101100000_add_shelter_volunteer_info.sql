alter table public.shelters
  add column volunteer_info text constraint shelters_volunteer_info_length check (char_length(volunteer_info) <= 1000);

revoke all on public.shelters from anon, authenticated;
grant select on public.shelters to anon, authenticated;
