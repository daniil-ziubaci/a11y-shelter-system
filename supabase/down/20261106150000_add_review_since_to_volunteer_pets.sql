-- Откат: убирает колонку review_since и возвращает прежнее представление.
drop view public.volunteer_pets;

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
