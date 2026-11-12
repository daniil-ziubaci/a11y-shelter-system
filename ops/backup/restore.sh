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

echo "== Fitting the data to Supabase's own schemas in the target"
# Supabase updates its own schemas (auth, storage, ...) on its own schedule,
# so the target can be older or newer than the project the backup came from:
# a table or column that existed there may be missing here. The site's data
# (schema public) is never changed. In other schemas, an EMPTY missing table
# or a missing column that is NULL in every row is left out with a warning;
# anything that would lose data stops the restore instead.
psql "$TARGET_DB_URL" --no-psqlrc -At -F $'\t' > "$work/target.tsv" <<'SQL'
select n.nspname || '.' || c.relname,
       coalesce(string_agg(a.attname, ',' order by a.attnum), '')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_attribute a
  on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
where c.relkind in ('r', 'p', 'S') and n.nspname <> 'public'
group by 1
SQL
python3 - "$work/data.sql" "$work/target.tsv" "$work/data.fit.sql" <<'PY'
import re
import sys

data_path, target_path, out_path = sys.argv[1:4]
target = {}
for line in open(target_path, encoding="utf-8"):
    name, _, columns = line.rstrip("\n").partition("\t")
    target[name] = set(filter(None, columns.split(",")))

copy_re = re.compile(r'^COPY "([^"]+)"\."([^"]+)" \((.*)\) FROM stdin;$')
setval_re = re.compile(r"""^SELECT pg_catalog\.setval\('"([^"]+)"\."([^"]+)"'""")
lines = open(data_path, encoding="utf-8").read().split("\n")
out = []
problems = []
i = 0
while i < len(lines):
    line = lines[i]
    seq = setval_re.match(line)
    if seq and seq.group(1) != "public" and f"{seq.group(1)}.{seq.group(2)}" not in target:
        print(f"Warning: skipped counter of missing {seq.group(1)}.{seq.group(2)}", file=sys.stderr)
        i += 1
        continue
    copy = copy_re.match(line)
    if not copy or copy.group(1) == "public":
        out.append(line)
        i += 1
        continue
    schema, table = copy.group(1), copy.group(2)
    columns = [c.strip().strip('"') for c in copy.group(3).split(",")]
    end = lines.index("\\.", i + 1)
    rows = lines[i + 1:end]
    name = f"{schema}.{table}"
    if name not in target:
        if rows:
            problems.append(f"{name} is missing in the target but has {len(rows)} rows in the backup")
        else:
            print(f"Warning: skipped empty {name}, which the target does not have", file=sys.stderr)
        i = end + 1
        continue
    keep = [n for n, c in enumerate(columns) if c in target[name]]
    if len(keep) == len(columns):
        out.extend(lines[i:end + 1])
        i = end + 1
        continue
    dropped = [columns[n] for n in range(len(columns)) if n not in keep]
    split_rows = [row.split("\t") for row in rows]
    lossy = [c for n, c in enumerate(columns) if n not in keep and any(r[n] != "\\N" for r in split_rows)]
    if lossy:
        problems.append(f"{name}: target has no column(s) {', '.join(lossy)}, which hold data in the backup")
        i = end + 1
        continue
    print(f"Warning: {name}: left out empty column(s) {', '.join(dropped)} the target does not have", file=sys.stderr)
    out.append(f'COPY "{schema}"."{table}" (' + ", ".join(f'"{columns[n]}"' for n in keep) + ") FROM stdin;")
    out.extend("\t".join(r[n] for n in keep) for r in split_rows)
    out.append("\\.")
    i = end + 1

if problems:
    print("The backup does not fit this Supabase project without losing data:", file=sys.stderr)
    for problem in problems:
        print(f"  - {problem}", file=sys.stderr)
    print("Restore into a Supabase project at least as new as the one backed up.", file=sys.stderr)
    sys.exit(1)
open(out_path, "w", encoding="utf-8").write("\n".join(out))
PY

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
  --file "$work/data.fit.sql" \
  --command 'SET session_replication_role = origin' \
  --file "$work/storage_policies.sql" > /dev/null

echo "== Uploading photos"
# Only the files that were in storage when the backup was made (the rows of
# storage.objects in the dump). photos/ also keeps files deleted from the
# site since, in case one was deleted by mistake; those are not uploaded.
python3 - "$work/data.sql" > "$work/used.txt" <<'PY'
import re
import sys

copy_re = re.compile(r'^COPY "storage"\."objects" \((.*)\) FROM stdin;$')
lines = open(sys.argv[1], encoding="utf-8").read().split("\n")
for i, line in enumerate(lines):
    match = copy_re.match(line)
    if not match:
        continue
    columns = [c.strip().strip('"') for c in match.group(1).split(",")]
    bucket_at, name_at = columns.index("bucket_id"), columns.index("name")
    for row in lines[i + 1:lines.index("\\.", i + 1)]:
        fields = row.split("\t")
        if fields[bucket_at] == "pet-photos":
            name = re.sub(r"\\(.)", lambda m: {"t": "\t", "n": "\n"}.get(m.group(1), m.group(1)), fields[name_at])
            print(name)
    break
PY
used="$(wc -l < "$work/used.txt")"
present="$(find "$photos" -type f ! -name '*.part' | wc -l)"
total=0
failed=0
missing=0
while IFS= read -r name; do
  [ -n "$name" ] || continue
  total=$((total + 1))
  file="$photos/$name"
  if [ ! -f "$file" ]; then
    echo "Missing in the backup: $name" >&2
    missing=$((missing + 1))
    continue
  fi
  case "$name" in
    *.webp) type=image/webp ;;
    *.jpg | *.jpeg) type=image/jpeg ;;
    *.png) type=image/png ;;
    *.svg) type=image/svg+xml ;;
    *.ico) type=image/x-icon ;;
    *) type=application/octet-stream ;;
  esac
  encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
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
done < "$work/used.txt"

echo "Photos uploaded: $((total - failed - missing)) of $used used by the site"
echo "Not uploaded (deleted from the site earlier, kept in photos/): $((present - (total - missing)))"
[ "$failed" -eq 0 ] && [ "$missing" -eq 0 ]
