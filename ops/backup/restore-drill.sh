#!/usr/bin/env bash
# Weekly restore drill: proves that the latest backup can actually be restored.
#
# Starts a throwaway empty Supabase (Docker) next to the backup files, restores
# the newest db/*.tar.gz.gpg and photos/ into it with restore.sh, then compares
# the result with the backup itself. The real site and database are never
# touched. Only counts are printed, never personal data.
#
# Run from the root of the backups repository.
#
# Environment:
#   BACKUP_PASSPHRASE  the passphrase the backups are encrypted with
#   SUPABASE_CLI       how to call the Supabase CLI (default: supabase)
#   SUPABASE_URL       the live project; its storage version is used for the
#                      throwaway Supabase so it matches what a new project gets
#   STORAGE_VERSION    use this storage version instead (for example v1.89.13)

set -euo pipefail

: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"
supabase="${SUPABASE_CLI:-supabase}"
repo="$(pwd)"
shopt -s nullglob
archives=(db/*.tar.gz.gpg)
shopt -u nullglob
archive=""
if [ "${#archives[@]}" -gt 0 ]; then
  archive="$(printf '%s\n' "${archives[@]}" | sort | tail -n 1)"
fi
if [ -z "$archive" ]; then
  echo "No backup in db/" >&2
  exit 1
fi

work="$(mktemp -d)"
cleanup() {
  (cd "$work/project" 2> /dev/null && $supabase stop --no-backup > /dev/null 2>&1) || true
  rm -rf "${work:?}"
}
trap cleanup EXIT

echo "== Drill for $archive"
echo "== Starting an empty Supabase"
mkdir -p "$work/project"
(
  cd "$work/project"
  $supabase init > /dev/null
  version="${STORAGE_VERSION:-}"
  if [ -z "$version" ] && [ -n "${SUPABASE_URL:-}" ]; then
    version="$(curl -fsS --max-time 20 "$SUPABASE_URL/storage/v1/version" || true)"
  fi
  if [[ "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    mkdir -p supabase/.temp
    echo "v${version#v}" > supabase/.temp/storage-version
    echo "Storage version: v${version#v} (same as the live project)"
  else
    echo "Storage version: CLI default (live version unknown)"
  fi
  $supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,supavisor,mailpit,postgres-meta > /dev/null
)
env_file="$work/supabase.env"
(cd "$work/project" && $supabase status -o env) > "$env_file"
# shellcheck disable=SC1090
source "$env_file"
db="$DB_URL"
api="$API_URL"
export TARGET_DB_URL="$db" TARGET_URL="$api" TARGET_SERVICE_KEY="$SERVICE_ROLE_KEY"

echo "== Restoring"
"$repo/restore.sh" "$archive" photos

echo "== Checking"
mkdir -p "$work/dump"
gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 \
  --decrypt "$archive" 3<<<"$BACKUP_PASSPHRASE" | tar -C "$work/dump" -xzf -

failed=0
check() {
  if [ "$1" = ok ]; then
    echo "PASS  $2"
  else
    echo "FAIL  $2"
    failed=1
  fi
}
sql() { psql "$db" --no-psqlrc -At -c "$1"; }

# Row counts in the dump: lines between "COPY schema.table" and "\.".
rows_in_dump() {
  awk -v table="COPY $1 " '
    index($0, table) == 1 { inside = 1; next }
    inside && $0 == "\\." { exit }
    inside { count++ }
    END { print count + 0 }
  ' "$work/dump/data.sql"
}

for table in auth.users public.shelters public.shelter_members public.pets \
  public.purchase_items public.projects public.shelter_photos; do
  schema="${table%%.*}"
  name="${table#*.}"
  expected="$(rows_in_dump "\"$schema\".\"$name\"")"
  actual="$(sql "select count(*) from $table")"
  check "$([ "$expected" = "$actual" ] && echo ok)" "$table: $actual of $expected rows"
done

with_password="$(sql "select count(*) from auth.users where encrypted_password is not null and encrypted_password <> ''")"
users="$(sql "select count(*) from auth.users")"
check "$([ "$with_password" = "$users" ] && echo ok)" "sign-in passwords kept for $with_password of $users users"

expected_policies="$(grep -c '^create policy' "$work/dump/storage_policies.sql")"
policies="$(sql "select count(*) from pg_policies where schemaname = 'storage'")"
check "$([ "$expected_policies" -gt 0 ] && [ "$policies" = "$expected_policies" ] && echo ok)" \
  "storage policies: $policies of $expected_policies (volunteers can upload photos)"

anon_writes="$(sql "select count(*) from information_schema.role_table_grants where table_schema = 'public' and grantee = 'anon' and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')")"
check "$([ "$anon_writes" = 0 ] && echo ok)" "anonymous visitors have no write grants ($anon_writes)"
status="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$api/rest/v1/shelters" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d '{"slug":"drill","name":"drill"}')"
check "$([ "$status" = 401 ] || [ "$status" = 403 ] && echo ok)" "anonymous insert is refused (HTTP $status)"

# The photos the site used at backup time: storage.objects rows in the dump.
python3 - "$work/dump/data.sql" > "$work/used.txt" <<'PY'
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
total=0
same=0
while IFS= read -r name; do
  [ -n "$name" ] || continue
  total=$((total + 1))
  [ -f "photos/$name" ] || continue
  encoded="$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$name")"
  served="$(curl -fsS "$api/storage/v1/object/public/pet-photos/$encoded" | sha256sum | cut -d' ' -f1)" || served=""
  stored="$(sha256sum "photos/$name" | cut -d' ' -f1)"
  [ "$served" = "$stored" ] && same=$((same + 1))
done < "$work/used.txt"
check "$([ "$total" -gt 0 ] && [ "$same" = "$total" ] && echo ok)" "photos used by the site served byte for byte: $same of $total"
kept="$(find photos -type f ! -name '*.part' | wc -l)"
uploaded="$(sql "select count(*) from storage.objects where bucket_id = 'pet-photos'")"
check "$([ "$uploaded" = "$total" ] && echo ok)" "storage holds only the used photos ($uploaded; photos/ keeps $kept, including deleted ones)"

missing=0
pets=0
copies_missing=0
while IFS= read -r url; do
  [ -n "$url" ] || continue
  pets=$((pets + 1))
  path="${url#*/storage/v1/object/public/}"
  code="$(curl -s -o /dev/null -w '%{http_code}' "$api/storage/v1/object/public/$path")"
  [ "$code" = 200 ] || missing=$((missing + 1))
  for copy in "${path%.*}-card.${path##*.}" "${path%.*}-og.jpg"; do
    code="$(curl -s -o /dev/null -w '%{http_code}' "$api/storage/v1/object/public/$copy")"
    [ "$code" = 200 ] || copies_missing=$((copies_missing + 1))
  done
done < <(sql "select photo_url from public.pets where photo_url like '%/storage/v1/object/public/%'")
check "$([ "$missing" = 0 ] && echo ok)" "every pet photo opens ($pets pets, $missing missing)"
# Card copies and link previews can be missing on the live site too
# (scripts/add-card-copies.ts, scripts/add-preview-copies.ts), so they are
# reported but do not fail the drill.
echo "INFO  card copies and link previews missing: $copies_missing"

if [ "$failed" -ne 0 ]; then
  echo "RESTORE DRILL FAILED" >&2
  exit 1
fi
echo "RESTORE DRILL PASSED"
