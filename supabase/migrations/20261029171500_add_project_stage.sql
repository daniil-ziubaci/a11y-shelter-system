alter table public.projects
  add column stage text not null default 'в работе'
  check (stage in ('готовим', 'в работе', 'почти готово'));

revoke insert (stage), update (stage) on public.projects from anon, authenticated;

grant insert (stage) on public.projects to authenticated;
grant update (stage) on public.projects to authenticated;