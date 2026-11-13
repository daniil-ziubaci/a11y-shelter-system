#!/usr/bin/env bash
# Moves ONE shelter from the old multi-shelter site (schema of the main
# branch) into a new project with the single-shelter schema
# (supabase/migrations/20261113000000_single_shelter.sql).
#
# Without --apply it only shows the plan and changes nothing. With --apply it
# copies, in one transaction, the shelter, its volunteers with their sign-in
# accounts (e-mail, password hash, second factor), animals, enclosures,
# projects, needs, the purchase log and the gallery; then the shelter's photos
# from storage; then compares the target with the source and fails loudly on
# any difference.
#
# Source, one of:
#   --backup db/2026-11-12.tar.gz.gpg --photos photos
#       a copy made by ops/backup/backup.sh. It is restored with
#       ops/backup/restore.sh into a throwaway local Supabase (Docker) that is
#       removed at the end. Needs BACKUP_PASSPHRASE.
#   SOURCE_DB_URL and SOURCE_URL
#       a running old-schema database (for example a project restored by hand).
#       Only read, never changed.
#
# Target (a NEW project where the single-shelter migration is applied and no
# data exists yet):
#   TARGET_DB_URL       connection string (Session pooler for a hosted project)
#   TARGET_URL          https://<new project>.supabase.co
#   TARGET_SERVICE_KEY  service_role key of the new project (uploads photos)
#
#   ops/migrate/migrate.sh --slug live-life --backup db/X.tar.gz.gpg --photos photos
#   ops/migrate/migrate.sh --slug live-life --backup db/X.tar.gz.gpg --photos photos --apply
#
# Sessions are not moved: volunteers sign in again with their old password
# and the same authenticator app.

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
supabase="${SUPABASE_CLI:-supabase}"
slug=""
backup=""
photos=""
apply=0
while [ $# -gt 0 ]; do
  case "$1" in
    --slug) slug="${2:?}"; shift 2 ;;
    --backup) backup="${2:?}"; shift 2 ;;
    --photos) photos="${2:?}"; shift 2 ;;
    --apply) apply=1; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done
: "${slug:?--slug is required (the old address of the shelter, for example live-life)}"
: "${TARGET_DB_URL:?TARGET_DB_URL is not set}"
: "${TARGET_URL:?TARGET_URL is not set}"
: "${TARGET_SERVICE_KEY:?TARGET_SERVICE_KEY is not set}"
if [[ ! "$slug" =~ ^[a-z0-9-]+$ ]]; then
  echo "--slug may contain only a-z, 0-9 and -" >&2
  exit 2
fi

work="$(mktemp -d)"
cleanup() {
  if [ -d "$work/source" ]; then
    (cd "$work/source" && $supabase stop --no-backup > /dev/null 2>&1) || true
  fi
  rm -rf "${work:?}"
}
trap cleanup EXIT

if [ -n "$backup" ]; then
  : "${photos:?--photos is required with --backup}"
  : "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
  backup="$(cd "$(dirname "$backup")" && pwd)/$(basename "$backup")"
  photos="$(cd "$photos" && pwd)"
  echo "== Restoring the backup into a throwaway Supabase (ports 55320-55329)"
  mkdir -p "$work/source"
  (
    cd "$work/source"
    $supabase init > /dev/null
    sed -i -E 's/= 5432([0-9])/= 5532\1/; s/= 8083$/= 8093/' supabase/config.toml
    sed -i -E 's/^project_id = .*/project_id = "migrate-source"/' supabase/config.toml
    $supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,supavisor,mailpit,postgres-meta > /dev/null
    $supabase status -o env > "$work/source.env"
  )
  source_db="$(grep '^DB_URL=' "$work/source.env" | cut -d= -f2- | tr -d '"')"
  source_url="$(grep '^API_URL=' "$work/source.env" | cut -d= -f2- | tr -d '"')"
  source_key="$(grep '^SERVICE_ROLE_KEY=' "$work/source.env" | cut -d= -f2- | tr -d '"')"
  TARGET_DB_URL="$source_db" TARGET_URL="$source_url" TARGET_SERVICE_KEY="$source_key" \
    "$here/../backup/restore.sh" "$backup" "$photos"
else
  : "${SOURCE_DB_URL:?SOURCE_DB_URL is not set (or use --backup)}"
  : "${SOURCE_URL:?SOURCE_URL is not set (or use --backup)}"
  source_db="$SOURCE_DB_URL"
  source_url="$SOURCE_URL"
fi

source_origin="$(python3 -c 'import sys, urllib.parse; u = urllib.parse.urlsplit(sys.argv[1]); print(f"{u.scheme}://{u.netloc}")' "$source_url")"
target_origin="$(python3 -c 'import sys, urllib.parse; u = urllib.parse.urlsplit(sys.argv[1]); print(f"{u.scheme}://{u.netloc}")' "$TARGET_URL")"

src() { psql "$source_db" --no-psqlrc -v ON_ERROR_STOP=1 -q -At "$@"; }
dst() { psql "$TARGET_DB_URL" --no-psqlrc -v ON_ERROR_STOP=1 -q -At "$@"; }

echo "== Checking the source"
if [ "$(src -c "select to_regclass('public.shelters') is not null")" != t ]; then
  echo "The source has no public.shelters: it is not the old multi-shelter schema" >&2
  exit 1
fi
shelter_id="$(src -v slug="$slug" <<'SQL'
select id from public.shelters where slug = :'slug';
SQL
)"
if [ -z "$shelter_id" ]; then
  echo "The source has no shelter with the address $slug" >&2
  exit 1
fi

# Every query below reads only this shelter's rows.
cat > "$work/source.sql" <<SQL
create temp view m_shelter as
  select name, name_en, name_ro, brand_path, created_at, city, address, contact_phone,
    contact_messenger, contact_email, contact_hours, about, about_title, about_title_en,
    about_title_ro, founded_year, legal_info, adoption_info, photo_path, photo_alt,
    instagram_url, facebook_url, tiktok_url, viber_url, telegram_url, whatsapp_url,
    payment_url, paypal_email, donation_text, content_language, translations, is_published
  from public.shelters where id = '$shelter_id';
create temp view m_volunteers as
  select user_id from public.shelter_members where shelter_id = '$shelter_id';
create temp view m_pets as
  select id, name, species, sex, birth_date, is_age_approximate, size, health, description,
    status, status_changed_at, needs_treatment_since,
    replace(photo_url, '$source_origin/', '$target_origin/') as photo_url,
    photo_alt, translations, created_at
  from public.pets where shelter_id = '$shelter_id';
create temp view m_pet_internal as
  select i.pet_id, i.enclosure from public.pet_internal i
  join public.pets p on p.id = i.pet_id where p.shelter_id = '$shelter_id';
create temp view m_projects as
  select id, title, description, status, help_kinds, is_pinned, is_archived, photo_path,
    photo_alt, progress_total, progress_done, progress_unit, translations, completed_at,
    created_at, updated_at
  from public.projects where shelter_id = '$shelter_id';
create temp view m_purchase_items as
  select id, name, category, unit, remaining, is_urgent, is_archived, note, translations, created_at
  from public.purchase_items where shelter_id = '$shelter_id';
create temp view m_purchase_log as
  select id, item_id, amount, created_at from public.purchase_log where shelter_id = '$shelter_id';
create temp view m_gallery_photos as
  select id, source_name, path, thumb_path, alt, alt_en, alt_ro, position, created_at
  from public.shelter_photos where shelter_id = '$shelter_id';
create temp view m_objects as
  select o.name, coalesce(o.metadata ->> 'mimetype', 'application/octet-stream') as type,
    coalesce((o.metadata ->> 'size')::bigint, 0) as size
  from storage.objects o
  where o.bucket_id = 'pet-photos'
    and (
      o.name like '$shelter_id/%'
      or o.name in (select photo_path from public.shelters where id = '$shelter_id')
      or o.name like (select brand_path || '/%' from public.shelters where id = '$shelter_id')
    );
SQL

tables=(shelter volunteers pets pet_internal projects purchase_items purchase_log gallery_photos)
declare -A source_count
for table in "${tables[@]}"; do
  source_count[$table]="$(src -f "$work/source.sql" -c "select count(*) from m_$table" | tail -n 1)"
done
users="$(src -f "$work/source.sql" -c "select count(*) from auth.users where id in (select user_id from m_volunteers)" | tail -n 1)"
factors="$(src -f "$work/source.sql" -c "select count(*) from auth.mfa_factors where status = 'verified' and user_id in (select user_id from m_volunteers)" | tail -n 1)"
objects="$(src -f "$work/source.sql" -c "select count(*) from m_objects" | tail -n 1)"
other_users="$(src -f "$work/source.sql" -c "select count(*) from auth.users where id not in (select user_id from m_volunteers)" | tail -n 1)"
other_shelters="$(src -c "select count(*) from public.shelters where id <> '$shelter_id'")"

echo "== Checking the target"
if [ "$(dst -c "select to_regclass('public.shelter') is not null and to_regclass('public.shelters') is null")" != t ]; then
  echo "The target does not have the single-shelter schema. Apply supabase/migrations first." >&2
  exit 1
fi
target_rows="$(dst -c "select (select count(*) from public.shelter) + (select count(*) from public.volunteers) + (select count(*) from public.pets) + (select count(*) from public.projects) + (select count(*) from public.purchase_items) + (select count(*) from public.gallery_photos)")"
target_users="$(dst -c "select count(*) from auth.users")"
target_objects="$(dst -c "select count(*) from storage.objects where bucket_id = 'pet-photos'")"

echo
echo "Plan: shelter «$slug» ($shelter_id)"
echo "  from: $source_origin"
echo "  to:   $target_origin"
for table in "${tables[@]}"; do
  printf '  %-16s %s\n' "$table" "${source_count[$table]}"
done
printf '  %-16s %s (with password and %s verified second factors)\n' "sign-in users" "$users" "$factors"
printf '  %-16s %s\n' "photos" "$objects"
echo "  pet photo addresses are rewritten to the new project"
echo "Left in the source: $other_shelters other shelter(s), $other_users sign-in user(s) without this shelter"
echo "Target now: $target_rows site rows, $target_users sign-in users, $target_objects photos"

if [ "$target_rows" != 0 ] || [ "$target_objects" != 0 ]; then
  echo "The target is not empty. Move into a NEW project only." >&2
  exit 1
fi
if [ "${source_count[shelter]}" != 1 ]; then
  echo "Expected exactly one shelter row, got ${source_count[shelter]}" >&2
  exit 1
fi
clash="$(src -f "$work/source.sql" -c "select coalesce(string_agg(id::text, ','), '') from auth.users where id in (select user_id from m_volunteers)" | tail -n 1)"
if [ -n "$clash" ] && [ "$(dst -c "select count(*) from auth.users where id = any (string_to_array('$clash', ',')::uuid[])")" != 0 ]; then
  echo "Some of these sign-in users already exist in the target" >&2
  exit 1
fi

if [ "$apply" -ne 1 ]; then
  echo
  echo "Nothing changed. Run again with --apply to move the data."
  exit 0
fi

echo
echo "== Copying the data (one transaction)"
common_columns() {
  local schema="$1" table="$2" query
  query="select column_name from information_schema.columns where table_schema = '$schema' and table_name = '$table' and is_generated = 'NEVER' and is_identity = 'NO' order by ordinal_position"
  dst -c "$query" > "$work/t.cols"
  src -c "$query" > "$work/s.cols"
  grep -Fxf "$work/s.cols" "$work/t.cols" | sed 's/.*/"&"/' | paste -sd, -
}
users_cols="$(common_columns auth users)"
identities_cols="$(common_columns auth identities)"
factors_cols="$(common_columns auth mfa_factors)"

export_rows() {
  src -f "$work/source.sql" -c "\\copy ($1) to '$work/$2.csv' with (format csv)" > /dev/null
}
export_rows "select $users_cols from auth.users where id in (select user_id from m_volunteers)" auth_users
export_rows "select $identities_cols from auth.identities where user_id in (select user_id from m_volunteers)" auth_identities
export_rows "select $factors_cols from auth.mfa_factors where user_id in (select user_id from m_volunteers)" auth_mfa_factors
for table in "${tables[@]}"; do
  export_rows "select * from m_$table" "$table"
done

{
  echo "set session_replication_role = replica;"
  echo "\\copy auth.users ($users_cols) from '$work/auth_users.csv' with (format csv)"
  echo "\\copy auth.identities ($identities_cols) from '$work/auth_identities.csv' with (format csv)"
  echo "\\copy auth.mfa_factors ($factors_cols) from '$work/auth_mfa_factors.csv' with (format csv)"
  echo "\\copy public.shelter (name, name_en, name_ro, brand_path, created_at, city, address, contact_phone, contact_messenger, contact_email, contact_hours, about, about_title, about_title_en, about_title_ro, founded_year, legal_info, adoption_info, photo_path, photo_alt, instagram_url, facebook_url, tiktok_url, viber_url, telegram_url, whatsapp_url, payment_url, paypal_email, donation_text, content_language, translations, is_published) from '$work/shelter.csv' with (format csv)"
  echo "\\copy public.volunteers (user_id) from '$work/volunteers.csv' with (format csv)"
  echo "\\copy public.pets (id, name, species, sex, birth_date, is_age_approximate, size, health, description, status, status_changed_at, needs_treatment_since, photo_url, photo_alt, translations, created_at) from '$work/pets.csv' with (format csv)"
  echo "\\copy public.pet_internal (pet_id, enclosure) from '$work/pet_internal.csv' with (format csv)"
  echo "\\copy public.projects (id, title, description, status, help_kinds, is_pinned, is_archived, photo_path, photo_alt, progress_total, progress_done, progress_unit, translations, completed_at, created_at, updated_at) from '$work/projects.csv' with (format csv)"
  echo "\\copy public.purchase_items (id, name, category, unit, remaining, is_urgent, is_archived, note, translations, created_at) from '$work/purchase_items.csv' with (format csv)"
  echo "\\copy public.purchase_log (id, item_id, amount, created_at) from '$work/purchase_log.csv' with (format csv)"
  echo "\\copy public.gallery_photos (id, source_name, path, thumb_path, alt, alt_en, alt_ro, position, created_at) from '$work/gallery_photos.csv' with (format csv)"
  echo "set session_replication_role = origin;"
} > "$work/load.sql"
PGOPTIONS='-c client_min_messages=warning' \
  psql "$TARGET_DB_URL" --no-psqlrc --single-transaction -v ON_ERROR_STOP=1 -q -f "$work/load.sql"

echo "== Copying photos"
src -f "$work/source.sql" -F $'\t' -c "select name, type from m_objects order by name" | tail -n +1 | grep -v '^CREATE VIEW$' > "$work/objects.tsv" || true
copied=0
failed=0
while IFS=$'\t' read -r name type; do
  [ -n "$name" ] || continue
  case "$name" in /* | *..*) echo "Skipped unsafe path: $name" >&2; failed=$((failed + 1)); continue ;; esac
  encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
  if curl -fsS --retry 3 --max-time 120 -o "$work/photo" "$source_url/storage/v1/object/public/pet-photos/$encoded" &&
    curl -fsS --retry 3 --max-time 120 -o /dev/null -X POST \
      -H "Authorization: Bearer $TARGET_SERVICE_KEY" -H "apikey: $TARGET_SERVICE_KEY" \
      -H "Content-Type: $type" -H "Cache-Control: max-age=31536000" \
      --data-binary "@$work/photo" "$TARGET_URL/storage/v1/object/pet-photos/$encoded"; then
    copied=$((copied + 1))
  else
    echo "Could not copy: $name" >&2
    failed=$((failed + 1))
  fi
done < "$work/objects.tsv"
echo "Photos copied: $copied, failed: $failed"

echo "== Comparing the target with the source"
problems=0
check() {
  if [ "$1" = ok ]; then echo "PASS  $2"; else echo "FAIL  $2"; problems=$((problems + 1)); fi
}
for table in "${tables[@]}"; do
  actual="$(dst -c "select count(*) from public.$table")"
  check "$([ "$actual" = "${source_count[$table]}" ] && echo ok)" "$table: $actual of ${source_count[$table]} rows"
done

fingerprint_users="select md5(coalesce(string_agg(id::text || email || coalesce(encrypted_password, ''), ',' order by id), '')) from auth.users"
fingerprint_factors="select md5(coalesce(string_agg(user_id::text || status::text || coalesce(secret, ''), ',' order by id), '')) from auth.mfa_factors"
fingerprint_identities="select md5(coalesce(string_agg(user_id::text || provider || provider_id, ',' order by id), '')) from auth.identities"
check "$([ "$(src -f "$work/source.sql" -c "$fingerprint_users where id in (select user_id from m_volunteers)" | tail -n 1)" = "$(dst -c "$fingerprint_users")" ] && echo ok)" \
  "sign-in users: $(dst -c "select count(*) from auth.users") of $users, e-mails and password hashes identical"
check "$([ "$(src -f "$work/source.sql" -c "$fingerprint_factors where user_id in (select user_id from m_volunteers)" | tail -n 1)" = "$(dst -c "$fingerprint_factors")" ] && echo ok)" \
  "second factors: $(dst -c "select count(*) from auth.mfa_factors where status = 'verified'") of $factors verified, secrets identical"
check "$([ "$(src -f "$work/source.sql" -c "$fingerprint_identities where user_id in (select user_id from m_volunteers)" | tail -n 1)" = "$(dst -c "$fingerprint_identities")" ] && echo ok)" \
  "sign-in identities identical"

fingerprint_pets="select md5(coalesce(string_agg(id::text || name || status || photo_url || translations::text, ',' order by id), ''))"
check "$([ "$(src -f "$work/source.sql" -c "$fingerprint_pets from m_pets" | tail -n 1)" = "$(dst -c "$fingerprint_pets from public.pets")" ] && echo ok)" \
  "animals identical (names, statuses, photo addresses, translations)"
fingerprint_items="select md5(coalesce(string_agg(id::text || name || remaining::text || translations::text, ',' order by id), ''))"
check "$([ "$(src -f "$work/source.sql" -c "$fingerprint_items from m_purchase_items" | tail -n 1)" = "$(dst -c "$fingerprint_items from public.purchase_items")" ] && echo ok)" \
  "needs identical (names, remaining amounts, translations)"
fingerprint_projects="select md5(coalesce(string_agg(id::text || title || status || coalesce(completed_at::text, '') || created_at::text, ',' order by id), ''))"
check "$([ "$(src -f "$work/source.sql" -c "$fingerprint_projects from m_projects" | tail -n 1)" = "$(dst -c "$fingerprint_projects from public.projects")" ] && echo ok)" \
  "projects identical (titles, statuses, completion and creation dates)"

target_objects="$(dst -c "select count(*) from storage.objects where bucket_id = 'pet-photos'")"
check "$([ "$target_objects" = "$objects" ] && [ "$failed" = 0 ] && echo ok)" "photos in storage: $target_objects of $objects"
same=0
while IFS=$'\t' read -r name type; do
  [ -n "$name" ] || continue
  encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
  a="$(curl -fsS "$source_url/storage/v1/object/public/pet-photos/$encoded" | sha256sum | cut -d' ' -f1)" || a=x
  b="$(curl -fsS "$TARGET_URL/storage/v1/object/public/pet-photos/$encoded" | sha256sum | cut -d' ' -f1)" || b=y
  [ "$a" = "$b" ] && same=$((same + 1))
done < "$work/objects.tsv"
check "$([ "$same" = "$objects" ] && echo ok)" "photos served byte for byte: $same of $objects"
broken=0
while IFS= read -r url; do
  [ -n "$url" ] || continue
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  [ "$code" = 200 ] || broken=$((broken + 1))
done < <(dst -c "select photo_url from public.pets")
check "$([ "$broken" = 0 ] && echo ok)" "every animal photo opens at its new address ($broken broken)"

if [ "$problems" -ne 0 ]; then
  echo "MIGRATION CHECK FAILED: $problems problem(s). The target is not ready; start again with a new empty project." >&2
  exit 1
fi
echo "MIGRATION CHECK PASSED"
