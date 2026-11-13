#!/usr/bin/env bash
# Daily backup of the Supabase project: database and photos.
#
# Runs in the private backups repository (see ops/backup/README.md), never in
# the public site repository: the database holds volunteers' e-mails and
# password hashes.
#
#   db/YYYY-MM-DD.tar.gz.gpg  roles, schema, data (including sign-in users) and
#                             storage access policies, encrypted with
#                             BACKUP_PASSPHRASE (AES-256)
#   photos/<path>             public files of the photo bucket; only new
#                             files are downloaded, deleted ones are kept
#
# Environment:
#   SUPABASE_DB_URL    session pooler connection string (IPv4)
#   SUPABASE_URL       https://<project>.supabase.co
#   BACKUP_PASSPHRASE  long random passphrase, also kept in a password manager
#   BACKUP_DIR         where db/ and photos/ live (default: current directory)
#   PHOTO_BUCKET       storage bucket with the site's photos (default: pet-photos)
#   KEEP_DAYS          database copies to keep in the working tree (default 60,
#                      at least 7; older ones stay in git history; the 7 newest
#                      copies are always kept)

set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is not set}"
: "${SUPABASE_URL:?SUPABASE_URL is not set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
backup_dir="${BACKUP_DIR:-.}"
keep_days="${KEEP_DAYS:-60}"
if [[ ! "$keep_days" =~ ^[0-9]+$ ]] || (( keep_days < 7 )); then
  echo "KEEP_DAYS must be a whole number of days, at least 7" >&2
  exit 1
fi
keep_newest=7
bucket="${PHOTO_BUCKET:-pet-photos}"
if [[ ! "$bucket" =~ ^[a-z0-9_-]+$ ]]; then
  echo "PHOTO_BUCKET may contain only a-z, 0-9, _ and -" >&2
  exit 1
fi
supabase="${SUPABASE_CLI:-supabase}"

stamp="$(date -u +%Y-%m-%d)"
work="$(mktemp -d)"
trap 'rm -rf "${work:?}"' EXIT

echo "== Database"
mkdir -p "$work/dump"
$supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/dump/roles.sql" --role-only
$supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/dump/schema.sql"
$supabase db dump --db-url "$SUPABASE_DB_URL" -f "$work/dump/data.sql" \
  --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

# A dump that silently lost a table is worse than a failed run: every table
# of the site's schema must have its rows section, whatever the schema is.
mapfile -t site_tables < <(grep -oE '^CREATE TABLE IF NOT EXISTS "public"\."[^"]+"' "$work/dump/schema.sql" |
  sed 's/^CREATE TABLE IF NOT EXISTS //')
if [ "${#site_tables[@]}" -eq 0 ]; then
  echo "Schema dump has no tables in public" >&2
  exit 1
fi
for table in '"auth"."users"' '"storage"."objects"' "${site_tables[@]}"; do
  if ! grep -q "^COPY $table " "$work/dump/data.sql"; then
    echo "Data dump has no rows section for $table" >&2
    exit 1
  fi
done
echo "Tables in the dump: auth.users, storage.objects and ${#site_tables[@]} of the site"

# The schema dump leaves out Supabase's own schemas, including the access
# policies on storage.objects that let volunteers upload photos. Save them
# separately so a restore brings them back.
psql "$SUPABASE_DB_URL" --no-psqlrc -At -v ON_ERROR_STOP=1 \
  > "$work/dump/storage_policies.sql" <<'SQL'
select format(
  E'drop policy if exists %I on %I.%I;\ncreate policy %I on %I.%I as %s for %s to %s%s%s;',
  policyname, schemaname, tablename,
  policyname, schemaname, tablename, permissive, cmd,
  (select string_agg(quote_ident(role), ', ') from unnest(roles) as role),
  case when qual is not null then E'\n  using (' || qual || ')' else '' end,
  case when with_check is not null then E'\n  with check (' || with_check || ')' else '' end
)
from pg_policies
where schemaname = 'storage'
order by tablename, policyname;
SQL
if ! grep -q "create policy" "$work/dump/storage_policies.sql"; then
  echo "No storage policies found: volunteers could not upload photos after a restore" >&2
  exit 1
fi

mkdir -p "$backup_dir/db"
archive="$backup_dir/db/$stamp.tar.gz.gpg"
tar -C "$work/dump" -czf - roles.sql schema.sql data.sql storage_policies.sql |
  gpg --batch --yes --quiet --pinentry-mode loopback \
    --passphrase-fd 3 --symmetric --cipher-algo AES256 \
    --output "$archive" 3<<<"$BACKUP_PASSPHRASE"
echo "Saved $archive ($(du -h "$archive" | cut -f1))"

# File dates are useless here (a fresh checkout gives every file today's
# date), so the age comes from the name.
# The newest copies are always kept, however old they are, so a long pause
# in backups never leaves the folder with today's copy alone.
oldest="$(date -u -d "-$keep_days days" +%Y-%m-%d)"
newest="$(find "$backup_dir/db" -maxdepth 1 -name '????-??-??.tar.gz.gpg' -printf '%f\n' | sort -r | head -n "$keep_newest")"
for old in "$backup_dir"/db/*.tar.gz.gpg; do
  day="$(basename "$old" .tar.gz.gpg)"
  if grep -qxF "$day.tar.gz.gpg" <<<"$newest"; then
    continue
  fi
  if [[ "$day" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] && [[ "$day" < "$oldest" ]]; then
    rm -f -- "$old"
    echo "Removed old copy $day (it stays in git history)"
  fi
done

echo "== Photos"
mkdir -p "$backup_dir/photos"
psql "$SUPABASE_DB_URL" --no-psqlrc -At \
  -c "select name from storage.objects where bucket_id = '$bucket' order by name" \
  > "$work/objects.txt"

total=0
added=0
failed=0
while IFS= read -r name; do
  [ -n "$name" ] || continue
  total=$((total + 1))
  case "$name" in
    /* | *..*)
      echo "Skipped unsafe path: $name" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac
  target="$backup_dir/photos/$name"
  [ -s "$target" ] && continue
  mkdir -p "$(dirname "$target")"
  encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
  if curl -fsS --retry 3 --max-time 120 -o "$target.part" \
    "$SUPABASE_URL/storage/v1/object/public/$bucket/$encoded"; then
    mv "$target.part" "$target"
    added=$((added + 1))
  else
    rm -f "$target.part"
    echo "Could not download: $name" >&2
    failed=$((failed + 1))
  fi
done < "$work/objects.txt"

echo "Photos in storage: $total, new: $added, failed: $failed"
if [ "$failed" -gt 0 ]; then
  exit 1
fi
