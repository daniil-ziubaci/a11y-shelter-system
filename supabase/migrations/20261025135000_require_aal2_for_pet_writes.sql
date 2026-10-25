-- Запись в анкеты животных принимается только после второго фактора (aal2).
-- Политики ограничивающие: работают вместе с существующими по правилу «И»,
-- не заменяют их. Чтение каталога не затрагивается.

create policy "Pet inserts require second factor"
  on public.pets
  as restrictive
  for insert
  to authenticated
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Pet updates require second factor"
  on public.pets
  as restrictive
  for update
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');