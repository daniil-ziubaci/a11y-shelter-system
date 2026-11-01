-- После отката колонка volunteer_info возвращается пустой: значения, которые были в ней до удаления, не восстанавливаются.
alter table public.shelters
  add column volunteer_info text constraint shelters_volunteer_info_length check (char_length(volunteer_info) <= 1000);
