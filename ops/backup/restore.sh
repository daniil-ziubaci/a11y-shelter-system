#!/usr/bin/env bash
# Restores a backup made by backup.sh into an EMPTY Supabase project
# (a new project, or a local one started without migrations).
#
#   ./restore.sh db/2026-11-12.tar.gz.gpg photos
#
# Environment:
#   TARGET_DB_URL       connection string of the empty project
#   TARGET_URL          https://<new-project>.supabase.co
#   TARGET_SERVICE_KEY  service_role key of the new project (uploads photos)
#   BACKUP_PASSPHRASE   the passphrase the backup was encrypted with

set -euo pipefail

archive="${1:?usage: restore.sh <db archive> <photos dir>}"
photos="${2:?usage: restore.sh <db archive> <photos dir>}"
: "${TARGET_DB_URL:?TARGET_DB_URL is not set}"
: "${TARGET_URL:?TARGET_URL is not set}"
: "${TARGET_SERVICE_KEY:?TARGET_SERVICE_KEY is not set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"

work="$(mktemp -d)"
trap 'rm -rf "${work:?}"' EXIT

echo "== Decrypting $archive"
gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 \
  --decrypt "$archive" 3<<<"$BACKUP_PASSPHRASE" | tar -C "$work" -xzf -

echo "== Restoring role settings (best effort)"
# The project has no custom roles: roles.sql only tunes Supabase's built-in
# roles, which a new project already has, and some lines (for example grants
# to supabase_realtime_admin) are not allowed for the postgres user.
if ! psql "$TARGET_DB_URL" --no-psqlrc --quiet --file "$work/roles.sql" \
  > /dev/null 2> "$work/roles.log"; then
  echo "Warning: roles.sql was not applied" >&2
fi
if [ -s "$work/roles.log" ]; then
  echo "Skipped role settings:" >&2
  cat "$work/roles.log" >&2
fi

echo "== Restoring schema and data (all or nothing)"
# A new Supabase project grants ALL on every new table, function and sequence
# in public to anon and authenticated (default privileges of postgres). The
# project's migrations revoke those grants, but a dump only lists grants, not
# revokes, so restored objects would end up with wider access than the
# original. Turning the defaults off first makes the restored grants exact;
# schema.sql sets the standard defaults again at its end.
PGOPTIONS='-c client_min_messages=warning' \
  psql "$TARGET_DB_URL" --no-psqlrc --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --command 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated' \
  --command 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated' \
  --command 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated' \
  --file "$work/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$work/data.sql" \
  --command 'SET session_replication_role = origin' \
  --file "$work/storage_policies.sql" > /dev/null

echo "== Uploading photos"
total=0
failed=0
while IFS= read -r -d '' file; do
  name="${file#"$photos"/}"
  case "$name" in
    *.webp) type=image/webp ;;
    *.jpg | *.jpeg) type=image/jpeg ;;
    *.png) type=image/png ;;
    *.svg) type=image/svg+xml ;;
    *.ico) type=image/x-icon ;;
    *) type=application/octet-stream ;;
  esac
  encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
  total=$((total + 1))
  if ! curl -fsS --retry 3 -o /dev/null -X POST \
    -H "Authorization: Bearer $TARGET_SERVICE_KEY" \
    -H "apikey: $TARGET_SERVICE_KEY" \
    -H "Content-Type: $type" \
    -H "Cache-Control: max-age=31536000" \
    -H "x-upsert: true" \
    --data-binary "@$file" \
    "$TARGET_URL/storage/v1/object/pet-photos/$encoded"; then
    echo "Could not upload: $name" >&2
    failed=$((failed + 1))
  fi
done < <(find "$photos" -type f ! -name '*.part' -print0)

echo "Photos uploaded: $((total - failed)) of $total"
[ "$failed" -eq 0 ]
