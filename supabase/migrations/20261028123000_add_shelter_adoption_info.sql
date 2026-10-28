-- Порядок знакомства с животным для будущих хозяев. Задаётся только координатором (у волонтёров права на запись в shelters нет).
alter table public.shelters
  add column adoption_info text constraint shelters_adoption_info_length check (char_length(adoption_info) <= 1000);

revoke all on public.shelters from anon, authenticated;
grant select on public.shelters to anon, authenticated;