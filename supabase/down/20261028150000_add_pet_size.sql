-- После отката размеры собак теряются: колонка удаляется вместе с правилами. Данные веса не затрагиваются.
alter table public.pets
  drop constraint pets_size_only_dogs,
  drop constraint pets_size_values;

alter table public.pets
  drop column size;