create function public.set_needs_treatment_since()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.needs_treatment_since is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.needs_treatment_since is not null then
      new.needs_treatment_since := old.needs_treatment_since;
      return new;
    end if;
  end if;

  new.needs_treatment_since := now();
  return new;
end;
$$;

revoke all on function public.set_needs_treatment_since() from public, anon, authenticated;

create trigger pets_set_needs_treatment_since
  before insert or update on public.pets
  for each row
  execute function public.set_needs_treatment_since();