-- Откат: снова делает все приюты видимыми всем и убирает флаг публикации.
-- Внимание: скрытые приюты после отката станут публичными.
drop policy if exists "Anonymous can read published shelters" on public.shelters;

drop policy if exists "Authenticated can read published or own shelters" on public.shelters;

create policy "Anyone can read shelters"
  on public.shelters
  for select
  to authenticated, anon
  using (true);

alter table public.shelters
  drop column if exists is_published;
