--Если эти права уже были выданы в облачном проекте до миграции, откат их снимет, поэтому откат нужно применять только на песочнице.
revoke select on public.shelter_members from authenticated;

revoke insert, update on public.pets from authenticated;
revoke select on public.pets from anon, authenticated;

revoke select on public.shelters from anon, authenticated;