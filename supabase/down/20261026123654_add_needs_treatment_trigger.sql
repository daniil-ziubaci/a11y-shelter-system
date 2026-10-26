-- No data is lost on rollback: the trigger and function hold only logic and can be recreated.
drop trigger pets_set_needs_treatment_since on public.pets;
drop function public.set_needs_treatment_since();