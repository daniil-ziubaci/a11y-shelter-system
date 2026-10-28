-- После отката тексты о порядке знакомства теряются: колонка удаляется вместе с правилом длины.
alter table public.shelters
  drop column adoption_info;