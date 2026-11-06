alter table public.pets
  add column needs_treatment_confirmed_at timestamptz;

create function public.set_needs_treatment_confirmed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.needs_treatment_since is null then
    new.needs_treatment_confirmed_at := null;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.needs_treatment_confirmed_at := null;
    return new;
  end if;

  if old.needs_treatment_since is null then
    new.needs_treatment_confirmed_at := null;
    return new;
  end if;

  if new.needs_treatment_confirmed_at is distinct from old.needs_treatment_confirmed_at then
    new.needs_treatment_confirmed_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.set_needs_treatment_confirmed_at() from public, anon, authenticated;

create trigger pets_touch_needs_treatment_confirmed_at
  before insert or update on public.pets
  for each row
  execute function public.set_needs_treatment_confirmed_at();

create or replace view public.volunteer_pets
with (security_invoker = true) as
select
  pets.id,
  pets.shelter_id,
  pets.name,
  pets.status,
  pets.status_changed_at,
  pets.needs_treatment_since,
  pets.photo_url,
  pets.birth_date,
  pets.is_age_approximate,
  pets.sex,
  pets.species,
  pets.size,
  pets.created_at,
  pet_internal.enclosure,
  concat_ws(' ', pets.name_search, pet_internal.enclosure) as search_text,
  pets.needs_treatment_confirmed_at
from public.pets
left join public.pet_internal on pet_internal.pet_id = pets.id;
