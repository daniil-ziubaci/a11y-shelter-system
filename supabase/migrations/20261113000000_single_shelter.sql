-- Initial schema of the site of ONE shelter (Live Life).
--
-- The shelter's own data lives in public.shelter, a table that can hold only
-- one row. Volunteers are listed in public.volunteers. No other table refers
-- to a shelter.
--
-- Access rules:
--   * anonymous visitors only read what is published, and only while the
--     shelter itself is published (shelter.is_published);
--   * volunteers read everything of the shelter, and change data only with a
--     second factor (aal2 in the session);
--   * stock of needs changes only through receive_purchase, record_consumption
--     and undo_purchase; nobody but the service role edits the shelter row,
--     the volunteer list, the gallery or pinned projects.

set check_function_bodies = false;

alter default privileges for role postgres in schema public revoke all on tables from postgres, anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on functions from postgres, anon, authenticated, service_role, public;
alter default privileges for role postgres in schema public revoke all on sequences from postgres, anon, authenticated, service_role;

-- Shelter (one row) ---------------------------------------------------------

create table public.shelter (
  id boolean primary key default true,
  name text not null,
  name_en text,
  name_ro text,
  brand_path text,
  created_at timestamptz not null default now(),
  city text,
  address text,
  contact_phone text,
  contact_messenger text,
  contact_email text,
  contact_hours text,
  about text,
  about_title text,
  about_title_en text,
  about_title_ro text,
  founded_year integer,
  legal_info text,
  adoption_info text,
  photo_path text,
  photo_alt text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  viber_url text,
  telegram_url text,
  whatsapp_url text,
  payment_url text,
  paypal_email text,
  donation_text text,
  content_language text not null default 'ru',
  translations jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  constraint shelter_single_row check (id),
  constraint shelter_name_check check (char_length(btrim(name)) between 1 and 150),
  constraint shelter_name_en_check check (char_length(btrim(name_en)) between 1 and 150),
  constraint shelter_name_ro_check check (char_length(btrim(name_ro)) between 1 and 150),
  constraint shelter_brand_path_check check (char_length(brand_path) between 1 and 200),
  constraint shelter_profile_text_length check (
    char_length(city) <= 100
    and char_length(address) <= 200
    and char_length(contact_hours) <= 200
    and char_length(legal_info) <= 500
    and char_length(contact_messenger) <= 300
  ),
  constraint shelter_contact_phone_format check (contact_phone ~ '^\+?[0-9 ()-]{5,20}$'),
  constraint shelter_contact_messenger_https check (contact_messenger ~ '^https://'),
  constraint shelter_contact_email_check check (
    contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and char_length(contact_email) <= 100
  ),
  constraint shelter_about_length check (char_length(about) <= 3000),
  constraint shelter_about_title_check check (about_title is null or char_length(about_title) between 1 and 200),
  constraint shelter_about_title_en_check check (about_title_en is null or char_length(about_title_en) between 1 and 200),
  constraint shelter_about_title_ro_check check (about_title_ro is null or char_length(about_title_ro) between 1 and 200),
  constraint shelter_founded_year_range check (founded_year between 1800 and 2100),
  constraint shelter_adoption_info_length check (char_length(adoption_info) <= 1000),
  constraint shelter_photo_path_length check (char_length(photo_path) between 1 and 300),
  constraint shelter_photo_alt_length check (char_length(photo_alt) between 1 and 300),
  constraint shelter_photo_alt_required check (photo_path is null or photo_alt is not null),
  constraint shelter_instagram_url_check check (instagram_url ~ '^https://' and char_length(instagram_url) <= 300),
  constraint shelter_facebook_url_check check (facebook_url ~ '^https://' and char_length(facebook_url) <= 300),
  constraint shelter_tiktok_url_check check (tiktok_url ~ '^https://' and char_length(tiktok_url) <= 300),
  constraint shelter_viber_url_check check (viber_url ~ '^https://' and char_length(viber_url) <= 300),
  constraint shelter_telegram_url_check check (telegram_url ~ '^https://' and char_length(telegram_url) <= 300),
  constraint shelter_whatsapp_url_check check (whatsapp_url ~ '^https://' and char_length(whatsapp_url) <= 300),
  constraint shelter_payment_url_check check (payment_url ~ '^https://' and char_length(payment_url) <= 300),
  constraint shelter_paypal_email_check check (
    paypal_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and char_length(paypal_email) <= 100
  ),
  constraint shelter_donation_text_length check (char_length(donation_text) <= 500),
  constraint shelter_content_language_check check (content_language in ('ru', 'ro', 'en')),
  constraint shelter_translations_check check (
    jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 20000
  )
);

create table public.volunteers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Helpers used by the access rules -----------------------------------------

create function public.is_volunteer() returns boolean
  language sql stable security definer
  set search_path = ''
  as $$
    select exists (
      select 1 from public.volunteers where user_id = (select auth.uid())
    )
  $$;

create function public.has_second_factor() returns boolean
  language sql stable
  set search_path = ''
  as $$
    select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
  $$;

create function public.is_site_published() returns boolean
  language sql stable security definer
  set search_path = ''
  as $$
    select coalesce((select is_published from public.shelter), false)
  $$;

create function public.translit_ru(input text) returns text
  language sql immutable parallel safe
  set search_path = ''
  as $$
    select coalesce(string_agg(coalesce(m.latin, c.letter), '' order by c.idx), '')
    from regexp_split_to_table(
      lower(translate(
        input,
        'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
        'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
      )),
      ''
    ) with ordinality as c(letter, idx)
    left join (
      values
        ('а', 'a'), ('б', 'b'), ('в', 'v'), ('г', 'g'), ('д', 'd'), ('е', 'e'),
        ('ё', 'yo'), ('ж', 'zh'), ('з', 'z'), ('и', 'i'), ('й', 'y'), ('к', 'k'),
        ('л', 'l'), ('м', 'm'), ('н', 'n'), ('о', 'o'), ('п', 'p'), ('р', 'r'),
        ('с', 's'), ('т', 't'), ('у', 'u'), ('ф', 'f'), ('х', 'kh'), ('ц', 'ts'),
        ('ч', 'ch'), ('ш', 'sh'), ('щ', 'shch'), ('ъ', ''), ('ы', 'y'), ('ь', ''),
        ('э', 'e'), ('ю', 'yu'), ('я', 'ya')
    ) as m(cyrillic, latin) on m.cyrillic = c.letter
  $$;

-- Animals ------------------------------------------------------------------

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null,
  sex text not null,
  birth_date date not null,
  is_age_approximate boolean not null,
  size text,
  health text not null,
  description text not null,
  status text not null default 'ищет дом',
  status_changed_at timestamptz not null default now(),
  needs_treatment_since timestamptz,
  photo_url text not null,
  photo_alt text not null,
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  status_rank smallint generated always as (
    case status
      when 'ищет дом' then 0
      when 'в процессе' then 1
      when 'на лечении' then 2
      else 3
    end
  ) stored,
  name_search text generated always as (name || '|' || public.translit_ru(name)) stored,
  constraint pets_species_check check (species in ('собака', 'кошка')),
  constraint pets_sex_check check (sex in ('мальчик', 'девочка')),
  constraint pets_size_values check (size in ('мелкая', 'средняя', 'крупная')),
  constraint pets_size_only_dogs check (size is null or species = 'собака'),
  constraint pets_dog_size_required check (species <> 'собака' or size is not null),
  constraint pets_status_check check (
    status in ('ищет дом', 'в процессе', 'на лечении', 'пристроен', 'снят с учёта')
  ),
  constraint pets_translations_check check (
    jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 20000
  )
);

create index pets_catalog_order_idx on public.pets (status_rank, created_at desc, name);

create table public.pet_internal (
  pet_id uuid primary key references public.pets (id) on delete cascade,
  enclosure text not null,
  constraint pet_internal_enclosure_check check (
    char_length(enclosure) between 1 and 40 and enclosure = btrim(enclosure)
  )
);

create function public.pets_set_status_changed_at() returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    new.status_changed_at := now();
    return new;
  end;
  $$;

create function public.set_needs_treatment_since() returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    if new.status in ('пристроен', 'снят с учёта') then
      new.needs_treatment_since := null;
      return new;
    end if;
    if new.needs_treatment_since is null then
      return new;
    end if;
    if tg_op = 'UPDATE' and old.needs_treatment_since is not null then
      new.needs_treatment_since := old.needs_treatment_since;
      return new;
    end if;
    new.needs_treatment_since := now();
    return new;
  end;
  $$;

create trigger pets_set_status_changed_at
  before update of status on public.pets
  for each row execute function public.pets_set_status_changed_at();

create trigger pets_set_needs_treatment_since
  before insert or update on public.pets
  for each row execute function public.set_needs_treatment_since();

create view public.volunteer_pets with (security_invoker = true) as
  select
    p.id,
    p.name,
    p.status,
    p.status_changed_at,
    p.needs_treatment_since,
    p.photo_url,
    p.birth_date,
    p.is_age_approximate,
    p.sex,
    p.species,
    p.size,
    p.created_at,
    i.enclosure,
    concat_ws(' ', p.name_search, i.enclosure) as search_text,
    least(
      case when p.status in ('в процессе', 'на лечении') then p.status_changed_at end,
      p.needs_treatment_since
    ) as review_since,
    case
      when p.status = 'на лечении' or p.needs_treatment_since is not null then 0
      else 1
    end as review_rank
  from public.pets as p
  left join public.pet_internal as i on i.pet_id = p.id;

-- Projects -----------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text not null default 'идёт',
  help_kinds text[] not null default array['money'],
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  photo_path text,
  photo_alt text,
  progress_total integer,
  progress_done integer,
  progress_unit text,
  translations jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_check check (length(btrim(title)) > 0 and length(title) <= 120),
  constraint projects_description_check check (length(btrim(description)) > 0 and length(description) <= 1000),
  constraint projects_status_check check (status in ('идёт', 'завершён')),
  constraint projects_help_kinds_valid check (
    cardinality(help_kinds) >= 1 and help_kinds <@ array['things', 'money']
  ),
  constraint projects_photo_valid check (
    (photo_path is null and photo_alt is null)
    or (
      photo_path is not null and photo_alt is not null
      and char_length(btrim(photo_path)) between 1 and 300
      and char_length(btrim(photo_alt)) between 1 and 200
    )
  ),
  constraint projects_progress_valid check (
    (progress_total is null and progress_done is null and progress_unit is null)
    or (
      progress_total is not null and progress_done is not null and progress_unit is not null
      and progress_total between 1 and 1000
      and progress_done between 0 and progress_total
      and char_length(btrim(progress_unit)) between 1 and 30
    )
  ),
  constraint projects_translations_check check (
    jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 20000
  )
);

create function public.set_project_completed_at() returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    if new.status <> 'завершён' then
      new.completed_at := null;
      return new;
    end if;
    if tg_op = 'UPDATE' and old.status = 'завершён' and old.completed_at is not null then
      new.completed_at := old.completed_at;
      return new;
    end if;
    new.completed_at := now();
    return new;
  end;
  $$;

create function public.projects_set_updated_at() returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    new.updated_at := now();
    return new;
  end;
  $$;

create trigger projects_set_completed_at
  before insert or update on public.projects
  for each row execute function public.set_project_completed_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.projects_set_updated_at();

-- Needs (purchase plan) ----------------------------------------------------

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  unit text not null,
  remaining numeric not null,
  is_urgent boolean not null default false,
  is_archived boolean not null default false,
  note text,
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint purchase_items_name_check check (length(btrim(name)) > 0),
  constraint purchase_items_unit_check check (length(btrim(unit)) > 0),
  constraint purchase_items_category_check check (
    category in ('корм', 'лекарства', 'расходники', 'гигиена', 'амуниция', 'инвентарь', 'территория', 'рабочим')
  ),
  constraint purchase_items_note_check check (length(btrim(note)) between 1 and 300),
  constraint purchase_items_archived_only_when_closed check (not is_archived or remaining = 0),
  constraint purchase_items_translations_check check (
    jsonb_typeof(translations) = 'object' and octet_length(translations::text) <= 20000
  )
);

create table public.purchase_log (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.purchase_items (id) on delete cascade,
  amount numeric not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint purchase_log_amount_check check (amount > 0)
);

create index purchase_log_created_at_idx on public.purchase_log (created_at desc);

create function public.receive_purchase(p_item_id uuid, p_amount numeric) returns numeric
  language plpgsql security definer
  set search_path = ''
  as $$
  declare
    v_remaining numeric;
  begin
    if p_amount is null or p_amount <= 0 or p_amount > 100000 then
      raise exception 'invalid amount' using errcode = '22023';
    end if;

    update public.purchase_items as i
    set remaining = i.remaining - p_amount
    where i.id = p_item_id
      and public.has_second_factor()
      and public.is_volunteer()
    returning i.remaining into v_remaining;

    if not found then
      raise exception 'item not found' using errcode = 'P0002';
    end if;

    insert into public.purchase_log (item_id, amount) values (p_item_id, p_amount);
    return v_remaining;
  end;
  $$;

create function public.record_consumption(p_item_id uuid, p_amount numeric) returns numeric
  language plpgsql security definer
  set search_path = ''
  as $$
  declare
    v_remaining numeric;
  begin
    if p_amount is null or p_amount <= 0 or p_amount > 100000 then
      raise exception 'invalid amount' using errcode = '22023';
    end if;

    update public.purchase_items as i
    set remaining = i.remaining + p_amount,
        is_urgent = i.is_urgent and i.remaining > 0,
        is_archived = false
    where i.id = p_item_id
      and public.has_second_factor()
      and public.is_volunteer()
    returning i.remaining into v_remaining;

    if not found then
      raise exception 'item not found' using errcode = 'P0002';
    end if;

    return v_remaining;
  end;
  $$;

create function public.undo_purchase(p_log_id uuid) returns numeric
  language plpgsql security definer
  set search_path = ''
  as $$
  declare
    v_log public.purchase_log;
    v_latest uuid;
    v_remaining numeric;
  begin
    select l.* into v_log
    from public.purchase_log as l
    where l.id = p_log_id
      and public.has_second_factor()
      and public.is_volunteer()
    for update;

    if not found then
      raise exception 'log entry not found' using errcode = 'P0002';
    end if;

    select l.id into v_latest
    from public.purchase_log as l
    order by l.created_at desc, l.id desc
    limit 1;

    if v_latest <> p_log_id or v_log.created_at < now() - interval '10 minutes' then
      raise exception 'log entry is not the latest or too old' using errcode = 'P0001';
    end if;

    update public.purchase_items as i
    set remaining = i.remaining + v_log.amount
    where i.id = v_log.item_id
    returning i.remaining into v_remaining;

    delete from public.purchase_log where id = p_log_id;
    return v_remaining;
  end;
  $$;

-- Gallery of the About page ------------------------------------------------

create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  path text not null,
  thumb_path text not null,
  alt text not null,
  alt_en text,
  alt_ro text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint gallery_photos_source_name_check check (char_length(source_name) between 1 and 100),
  constraint gallery_photos_path_check check (char_length(path) between 1 and 300),
  constraint gallery_photos_thumb_path_check check (char_length(thumb_path) between 1 and 300),
  constraint gallery_photos_alt_check check (char_length(alt) between 1 and 200),
  constraint gallery_photos_alt_en_check check (alt_en is null or char_length(alt_en) between 1 and 200),
  constraint gallery_photos_alt_ro_check check (alt_ro is null or char_length(alt_ro) between 1 and 200),
  constraint gallery_photos_position_check check (position >= 0),
  constraint gallery_photos_source_unique unique (source_name)
);

create index gallery_photos_position_idx on public.gallery_photos (position);

-- Row level security -------------------------------------------------------

alter table public.shelter enable row level security;
alter table public.volunteers enable row level security;
alter table public.pets enable row level security;
alter table public.pet_internal enable row level security;
alter table public.projects enable row level security;
alter table public.purchase_items enable row level security;
alter table public.purchase_log enable row level security;
alter table public.gallery_photos enable row level security;

create policy "Anonymous can read the published shelter"
  on public.shelter for select to anon
  using (is_published);

create policy "Volunteers can read the shelter, others only when published"
  on public.shelter for select to authenticated
  using (is_published or (select public.is_volunteer()));

create policy "Volunteers can read their own entry"
  on public.volunteers for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anonymous can read pets of the published shelter"
  on public.pets for select to anon
  using ((select public.is_site_published()));

create policy "Volunteers can read pets, others only when published"
  on public.pets for select to authenticated
  using ((select public.is_site_published()) or (select public.is_volunteer()));

create policy "Volunteers can add pets"
  on public.pets for insert to authenticated
  with check ((select public.is_volunteer()));

create policy "Volunteers can update pets"
  on public.pets for update to authenticated
  using ((select public.is_volunteer()))
  with check ((select public.is_volunteer()));

create policy "Pet inserts require second factor"
  on public.pets as restrictive for insert to authenticated
  with check ((select public.has_second_factor()));

create policy "Pet updates require second factor"
  on public.pets as restrictive for update to authenticated
  using ((select public.has_second_factor()))
  with check ((select public.has_second_factor()));

create policy "Volunteers can read enclosures"
  on public.pet_internal for select to authenticated
  using ((select public.is_volunteer()));

create policy "Volunteers can add enclosures"
  on public.pet_internal for insert to authenticated
  with check ((select public.is_volunteer()));

create policy "Volunteers can update enclosures"
  on public.pet_internal for update to authenticated
  using ((select public.is_volunteer()))
  with check ((select public.is_volunteer()));

create policy "Volunteers can delete enclosures"
  on public.pet_internal for delete to authenticated
  using ((select public.is_volunteer()));

create policy "Enclosure inserts require second factor"
  on public.pet_internal as restrictive for insert to authenticated
  with check ((select public.has_second_factor()));

create policy "Enclosure updates require second factor"
  on public.pet_internal as restrictive for update to authenticated
  using ((select public.has_second_factor()))
  with check ((select public.has_second_factor()));

create policy "Enclosure deletes require second factor"
  on public.pet_internal as restrictive for delete to authenticated
  using ((select public.has_second_factor()));

create policy "Anonymous can read active projects of the published shelter"
  on public.projects for select to anon
  using (not is_archived and (select public.is_site_published()));

create policy "Volunteers can read all projects, others only active published"
  on public.projects for select to authenticated
  using (
    (not is_archived and (select public.is_site_published()))
    or (select public.is_volunteer())
  );

create policy "Volunteers can add projects"
  on public.projects for insert to authenticated
  with check ((select public.is_volunteer()));

create policy "Volunteers can update projects"
  on public.projects for update to authenticated
  using ((select public.is_volunteer()))
  with check ((select public.is_volunteer()));

create policy "Project inserts require second factor"
  on public.projects as restrictive for insert to authenticated
  with check ((select public.has_second_factor()));

create policy "Project updates require second factor"
  on public.projects as restrictive for update to authenticated
  using ((select public.has_second_factor()))
  with check ((select public.has_second_factor()));

create policy "Anonymous can read open needs of the published shelter"
  on public.purchase_items for select to anon
  using (remaining > 0 and (select public.is_site_published()));

create policy "Volunteers can read all items, others only open published needs"
  on public.purchase_items for select to authenticated
  using (
    (remaining > 0 and (select public.is_site_published()))
    or (select public.is_volunteer())
  );

create policy "Volunteers can add items"
  on public.purchase_items for insert to authenticated
  with check ((select public.is_volunteer()));

create policy "Volunteers can update items"
  on public.purchase_items for update to authenticated
  using ((select public.is_volunteer()))
  with check ((select public.is_volunteer()));

create policy "Item inserts require second factor"
  on public.purchase_items as restrictive for insert to authenticated
  with check ((select public.has_second_factor()));

create policy "Item updates require second factor"
  on public.purchase_items as restrictive for update to authenticated
  using ((select public.has_second_factor()))
  with check ((select public.has_second_factor()));

create policy "Volunteers can read the purchase log"
  on public.purchase_log for select to authenticated
  using ((select public.is_volunteer()));

create policy "Anyone can read the gallery of the published shelter"
  on public.gallery_photos for select to anon, authenticated
  using ((select public.is_site_published()) or (select public.is_volunteer()));

-- Privileges ---------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant all on table public.shelter, public.volunteers, public.pets, public.pet_internal,
  public.projects, public.purchase_items, public.purchase_log, public.gallery_photos,
  public.volunteer_pets
  to service_role;

grant select on table public.shelter to anon, authenticated;
grant select on table public.volunteers to authenticated;

grant select on table public.pets to anon;
grant select, insert, update on table public.pets to authenticated;

grant select, insert, update, delete on table public.pet_internal to authenticated;

grant select on table public.volunteer_pets to authenticated;

grant select on table public.projects to anon, authenticated;
grant insert (title, description, status, help_kinds, photo_path, photo_alt,
  progress_total, progress_done, progress_unit)
  on table public.projects to authenticated;
grant update (title, description, status, help_kinds, photo_path, photo_alt,
  progress_total, progress_done, progress_unit, translations, is_archived)
  on table public.projects to authenticated;

grant select on table public.purchase_items to anon;
grant select, insert on table public.purchase_items to authenticated;
grant update (name, category, is_urgent, note, translations, is_archived)
  on table public.purchase_items to authenticated;

grant select on table public.purchase_log to authenticated;

grant select on table public.gallery_photos to anon, authenticated;

revoke all on function public.is_volunteer() from public;
revoke all on function public.has_second_factor() from public;
revoke all on function public.is_site_published() from public;
revoke all on function public.translit_ru(text) from public;
revoke all on function public.pets_set_status_changed_at() from public;
revoke all on function public.set_needs_treatment_since() from public;
revoke all on function public.set_project_completed_at() from public;
revoke all on function public.projects_set_updated_at() from public;
revoke all on function public.receive_purchase(uuid, numeric) from public;
revoke all on function public.record_consumption(uuid, numeric) from public;
revoke all on function public.undo_purchase(uuid) from public;

grant execute on function public.is_volunteer() to anon, authenticated, service_role;
grant execute on function public.has_second_factor() to anon, authenticated, service_role;
grant execute on function public.is_site_published() to anon, authenticated, service_role;
grant execute on function public.translit_ru(text) to anon, authenticated, service_role;
grant execute on function public.pets_set_status_changed_at() to service_role;
grant execute on function public.set_needs_treatment_since() to service_role;
grant execute on function public.set_project_completed_at() to service_role;
grant execute on function public.projects_set_updated_at() to service_role;
grant execute on function public.receive_purchase(uuid, numeric) to authenticated, service_role;
grant execute on function public.record_consumption(uuid, numeric) to authenticated, service_role;
grant execute on function public.undo_purchase(uuid) to authenticated, service_role;

-- Photo storage ------------------------------------------------------------
-- Public bucket: anyone can download a photo by its address. Volunteers with
-- a second factor upload new files into animals/... and projects/...; nobody
-- but the service role renames, overwrites or deletes files. Files of the old
-- multi-shelter site keep their paths (<old shelter id>/...).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Volunteers upload photos of animals and projects"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] in ('animals', 'projects')
    and (select public.is_volunteer())
  );

create policy "Photo uploads require second factor"
  on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'pet-photos' or (select public.has_second_factor()));

reset check_function_bodies;
