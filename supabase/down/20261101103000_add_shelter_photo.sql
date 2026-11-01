-- После отката путь и описание фото приюта теряются; сам файл в хранилище остаётся и его удаляет координатор.
alter table public.shelters
  drop constraint shelters_photo_alt_required,
  drop column photo_path,
  drop column photo_alt;
