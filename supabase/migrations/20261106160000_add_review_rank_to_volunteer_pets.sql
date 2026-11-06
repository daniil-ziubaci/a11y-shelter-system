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
  least(
    case
      when pets.status in ('в процессе', 'на лечении') then pets.status_changed_at
    end,
    pets.needs_treatment_since
  ) as review_since,
  case
    when pets.status = 'на лечении' or pets.needs_treatment_since is not null then 0
    else 1
  end as review_rank
from public.pets
left join public.pet_internal on pet_internal.pet_id = pets.id;
