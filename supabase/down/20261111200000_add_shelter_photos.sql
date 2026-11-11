-- Откат: удаляет таблицу галереи вместе со всеми строками.
-- Файлы в хранилище pet-photos (папка gallery) этот файл не удаляет.
drop table if exists public.shelter_photos;
