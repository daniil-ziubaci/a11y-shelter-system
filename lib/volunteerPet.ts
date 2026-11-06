export type VolunteerPet = {
  id: string;
  name: string;
  status: string;
  status_changed_at: string;
  needs_treatment_since: string | null;
  photo_url: string;
  birth_date: string;
  is_age_approximate: boolean;
  sex: string;
  species: string;
  size: string | null;
  enclosure: string | null;
};
