#!/usr/bin/env bash
# Runs newsletter database rules against a new disposable local PostgreSQL only — never the hosted database.
# Must run as a non-root OS user with PostgreSQL binaries on PATH.
set -euo pipefail
DIR=$(mktemp -d /tmp/newsletter-db.XXXXXX); PORT=55448
cleanup() { pg_ctl -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
initdb -D "$DIR/data" -A trust >/dev/null
pg_ctl -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null
Q() { psql -h "$DIR" -p "$PORT" -d postgres -v ON_ERROR_STOP=1 -qtA "$@"; }
Q <<'SQL'
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA private; CREATE SCHEMA storage;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE storage.objects(bucket_id text, name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array(name,'/') $$;
CREATE TYPE public.app_role AS ENUM ('admin','staff','player');
CREATE TABLE public.user_roles(user_id uuid, role app_role);
CREATE FUNCTION private.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $f$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $f$;
GRANT USAGE ON SCHEMA auth, private, public, storage TO anon, authenticated, service_role;
INSERT INTO user_roles VALUES ('aaaaaaaa-0000-4000-8000-000000000001','admin'),('aaaaaaaa-0000-4000-8000-000000000002','staff');
SQL
Q -f drizzle/migrations/0019_newsletter_test_drafts.sql >/dev/null
Q -f drizzle/migrations/0020_newsletter_subscribers_and_images.sql >/dev/null
H1=$(printf 'a%.0s' {1..64}); H2=$(printf 'b%.0s' {1..64}); H3=$(printf 'c%.0s' {1..64})
CONSENT="I agree to receive email updates from Vegreville Bowling Lanes."
fail=0
check() { if [ "$2" = "$3" ]; then echo "PASS $1"; else echo "FAIL $1 (got '$2', want '$3')"; fail=1; fi; }
svc() { Q -c "SET ROLE service_role; $1" | tail -1; }
as() { Q -c "BEGIN; SELECT set_config('request.jwt.claim.sub','$1',true); SET LOCAL ROLE $2; $3; ROLLBACK;" 2>&1 | grep -v '^$' | sed -n '2p'; }

check "invalid email rejected" "$(svc "SELECT newsletter_signup('bad','$CONSENT','$H1','c1')->>'ok'")" "false"
check "signup creates pending" "$(svc "SELECT newsletter_signup('Test@Example.com','$CONSENT','$H1','c1')->>'send'")" "true"
check "stored lowercase and pending" "$(svc "SELECT email||':'||status FROM newsletter_subscribers")" "test@example.com:pending"
check "pending gets no marketing" "$(svc "SELECT count(*) FROM newsletter_marketing_recipients()")" "0"
check "duplicate within 10 min sends nothing" "$(svc "SELECT newsletter_signup('test@example.com','$CONSENT','$H2','c1')")" '{"ok": true, "send": false}'
check "still one record" "$(svc "SELECT count(*) FROM newsletter_subscribers")" "1"
check "confirm works" "$(svc "SELECT newsletter_confirm('$H1')->>'status'")" "confirmed"
check "confirm link single-use" "$(svc "SELECT newsletter_confirm('$H1')->>'status'")" "invalid"
check "active gets marketing" "$(svc "SELECT count(*) FROM newsletter_marketing_recipients()")" "1"
check "repeat signup of active sends nothing" "$(svc "SELECT newsletter_signup('test@example.com','$CONSENT','$H2','c2')->>'send'")" "false"
ID=$(svc "SELECT id FROM newsletter_subscribers")
svc "SELECT newsletter_unsubscribe('$ID','link')" >/dev/null
check "unsubscribe stops marketing" "$(svc "SELECT count(*) FROM newsletter_marketing_recipients()")" "0"
check "unsubscribed stays unsubscribed without fresh signup" "$(svc "SELECT status FROM newsletter_subscribers")" "unsubscribed"
svc "SELECT newsletter_signup('late@example.com','$CONSENT','$H3','c3')" >/dev/null
svc "UPDATE newsletter_subscribers SET confirm_expires_at = now() - interval '1 minute' WHERE email='late@example.com'" >/dev/null
check "expired link rejected" "$(svc "SELECT newsletter_confirm('$H3')->>'status'")" "expired"
check "expired record not active" "$(svc "SELECT status FROM newsletter_subscribers WHERE email='late@example.com'")" "pending"
for i in 1 2 3 4 5; do svc "SELECT newsletter_signup('spam$i@example.com','$CONSENT','$H2','bot')" >/dev/null; done
check "rate limit per client" "$(svc "SELECT newsletter_signup('spam6@example.com','$CONSENT','$H2','bot')->>'reason'")" "limited"
check "history recorded" "$(svc "SELECT count(*)>=3 FROM newsletter_subscriber_events")" "t"
check "signed-out cannot read subscribers" "$(as '' anon 'SELECT count(*) FROM newsletter_subscribers' | grep -c 'permission denied')" "1"
check "signed-out cannot call signup directly" "$(as '' anon "SELECT newsletter_signup('x@example.com','$CONSENT','$H1','z')" | grep -c 'permission denied')" "1"
check "non-staff account sees no subscribers" "$(as aaaaaaaa-0000-4000-8000-000000000009 authenticated 'SELECT count(*) FROM newsletter_subscribers')" "0"
check "staff (non-admin) sees no subscribers" "$(as aaaaaaaa-0000-4000-8000-000000000002 authenticated 'SELECT count(*) FROM newsletter_subscribers')" "0"
check "admin sees subscribers" "$(as aaaaaaaa-0000-4000-8000-000000000001 authenticated 'SELECT count(*)>0 FROM newsletter_subscribers')" "t"
check "non-staff cannot read history" "$(as aaaaaaaa-0000-4000-8000-000000000009 authenticated 'SELECT count(*) FROM newsletter_subscriber_events')" "0"
check "non-admin cannot unsubscribe others" "$(as aaaaaaaa-0000-4000-8000-000000000002 authenticated "SELECT newsletter_admin_unsubscribe('$ID')" | grep -c 'Administrator access')" "1"
check "authenticated cannot list marketing recipients" "$(as aaaaaaaa-0000-4000-8000-000000000001 authenticated 'SELECT count(*) FROM newsletter_marketing_recipients()' | grep -c 'permission denied')" "1"
P='11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg'
check "unused newsletter photo stays private" "$(as '' anon "SELECT newsletter_image_in_use('$P')")" "f"
Q -c "BEGIN; SELECT set_config('request.jwt.claim.sub','aaaaaaaa-0000-4000-8000-000000000001',true); INSERT INTO newsletter_drafts(subject,body) VALUES ('[TEST]','![x](/api/public/newsletter-image?path=$P \"full center\")'); COMMIT;" >/dev/null
check "photo in saved newsletter viewable by link" "$(as '' anon "SELECT newsletter_image_in_use('$P')")" "t"
exit $fail
