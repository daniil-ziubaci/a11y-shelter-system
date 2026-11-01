-- После отката тексты для волонтёров теряются: колонка удаляется вместе с правилом длины.
alter table public.shelters
  drop column volunteer_info;
