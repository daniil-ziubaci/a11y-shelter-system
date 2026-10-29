create table public.projects (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id),
  title text not null check (length(btrim(title)) > 0 and length(title) <= 120),
  description text not null check (length(btrim(description)) > 0 and length(description) <= 1000),
  goal text check (length(btrim(goal)) > 0 and length(goal) <= 300),
  status text not null default 'идёт' check (status in ('идёт', 'завершён')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index projects_shelter_id_idx on public.projects (shelter_id);

create function public.set_project_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'завершён' then
    new.completed_at := null;
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'завершён' and old.completed_at is not null then
    new.completed_at := old.completed_at;
    return new;
  end if;

  new.completed_at := now();
  return new;
end;
$$;

revoke all on function public.set_project_completed_at() from public, anon, authenticated;

create trigger projects_set_completed_at
  before insert or update on public.projects
  for each row
  execute function public.set_project_completed_at();

alter table public.projects enable row level security;

revoke all on public.projects from anon, authenticated;

grant select on public.projects to anon, authenticated;
grant insert (shelter_id, title, description, goal, status) on public.projects to authenticated;
grant update (title, description, goal, status) on public.projects to authenticated;

create policy "Anyone can read projects"
  on public.projects
  for select
  to anon, authenticated
  using (true);

create policy "Members can add projects to their shelter"
  on public.projects
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = projects.shelter_id
    )
  );

create policy "Members can update projects of their shelter"
  on public.projects
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = projects.shelter_id
    )
  )
  with check (
    exists (
      select 1
      from public.shelter_members
      where shelter_members.user_id = (select auth.uid())
        and shelter_members.shelter_id = projects.shelter_id
    )
  );

create policy "Project inserts require second factor"
  on public.projects
  as restrictive
  for insert
  to authenticated
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy "Project updates require second factor"
  on public.projects
  as restrictive
  for update
  to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');