#!/usr/bin/env bash
set -euo pipefail
# Run only against a new disposable PostgreSQL instance, never the hosted database.
TEMP_DIR=$(mktemp -d /tmp/reservation-tests.XXXXXX)
PORT=55439
cleanup() { pg_ctl -D "$TEMP_DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TEMP_DIR"; }
trap cleanup EXIT
initdb -D "$TEMP_DIR/data" -A trust >"$TEMP_DIR/init.log"
pg_ctl -D "$TEMP_DIR/data" -o "-p $PORT -k $TEMP_DIR" -l "$TEMP_DIR/server.log" start
psql -h "$TEMP_DIR" -p "$PORT" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA private;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION private.is_staff(id uuid) RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT id='11111111-1111-4111-8111-111111111111'::uuid $$;
CREATE TYPE booking_status AS ENUM ('new','confirmed','declined','completed');
CREATE TABLE hours_of_operation(id uuid); INSERT INTO hours_of_operation VALUES(gen_random_uuid());
CREATE TABLE seasonal_hour_schedules(id uuid,date_label text);
CREATE TABLE booking_requests(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,booking_type text,contact_name text,email text,phone text,requested_date date,requested_time time,party_size integer,lanes integer,notes text,status booking_status,created_by uuid,updated_at timestamptz default now());
GRANT USAGE ON SCHEMA auth,private,public TO anon,authenticated;
SQL
for migration in drizzle/migrations/0008_*.sql drizzle/migrations/0009_*.sql drizzle/migrations/0010_*.sql drizzle/migrations/0011_*.sql drizzle/migrations/0012_*.sql; do
  psql -h "$TEMP_DIR" -p "$PORT" -d postgres -v ON_ERROR_STOP=1 -f "$migration"
done
RESERVATION_TEST_DB_URL="postgres://$(id -un)@localhost:$PORT/postgres" bunx vitest run src/lib/reservations.db.test.ts src/lib/reservations.test.ts
