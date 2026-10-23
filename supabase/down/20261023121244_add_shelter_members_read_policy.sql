--После отката таблица снова закрыта для всех, и любые политики, проверяющие принадлежность к приюту, перестанут пускать волонтёров.
drop policy "Members can read their own memberships"
  on public.shelter_members;