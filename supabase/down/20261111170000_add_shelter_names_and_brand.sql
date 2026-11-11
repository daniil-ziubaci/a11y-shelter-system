-- Откат: убирает названия приюта на других языках и путь к его логотипу.
-- Внимание: значения name_en, name_ro и brand_path будут потеряны безвозвратно.
alter table public.shelters
  drop constraint if exists shelters_name_en_check,
  drop constraint if exists shelters_name_ro_check,
  drop constraint if exists shelters_brand_path_check;

alter table public.shelters
  drop column if exists name_en,
  drop column if exists name_ro,
  drop column if exists brand_path;
