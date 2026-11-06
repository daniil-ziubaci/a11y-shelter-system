-- Откат: убирает дату подтверждения отметки лечения и возвращает прежнее представление.
-- Данные теряются: даты подтверждения пропадают, отметки снова считаются от даты включения.
drop view public.volunteer_pets;

drop trigger pets_touch_needs_treatment_confirmed_at on public.pets;
drop function public.set_needs_treatment_confirmed_at();
alter table public.pets drop column needs_treatment_confirmed_at;

create view public.volunteer_pets
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
  concat_ws(' ', pets.name_search, pet_internal.enclosure) as search_text
from public.pets
left join public.pet_internal on pet_internal.pet_id = pets.id;

revoke all on public.volunteer_pets from anon, authenticated;
grant select on public.volunteer_pets to authenticated;
