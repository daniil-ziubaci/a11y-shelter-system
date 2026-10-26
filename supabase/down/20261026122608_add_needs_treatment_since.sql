--Data in the column is lost on rollback
alter table public.pets 
  drop column needs_treatment_since;