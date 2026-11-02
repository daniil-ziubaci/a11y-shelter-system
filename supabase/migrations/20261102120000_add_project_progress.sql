alter table public.projects
  add column if not exists progress_total integer,
  add column if not exists progress_done integer,
  add column if not exists progress_unit text;

alter table public.projects
  add constraint projects_progress_valid check (
    (
      progress_total is null
      and progress_done is null
      and progress_unit is null
    )
    or (
      progress_total is not null
      and progress_done is not null
      and progress_unit is not null
      and progress_total between 1 and 1000
      and progress_done between 0 and progress_total
      and char_length(btrim(progress_unit)) between 1 and 30
    )
  );

grant select (progress_total, progress_done, progress_unit) on public.projects to anon, authenticated;
grant insert (progress_total, progress_done, progress_unit), update (progress_total, progress_done, progress_unit) on public.projects to authenticated;
