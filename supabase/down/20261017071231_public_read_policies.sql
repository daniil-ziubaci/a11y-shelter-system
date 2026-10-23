--После отката при включённом RLS чтение pets и shelters для всех будет закрыто, поэтому каталог и название приюта перестанут открываться, пока политики не вернут. Сами данные не удаляются.
drop policy "Anyone can read shelters"
  on public.shelters;

drop policy "Anyone can read pets"
  on public.pets;