# Six-lane reservations

## Implemented
- `/book`: real configuration reads, allocation and conservative duration estimates, availability, review, server submission and result states.
- `/inquiries`: special-event requests saved separately to the retained `booking_requests` table; no lane occupancy is created.
- `/admin` → Bookings: day/week schedule for Lane 1–6, pending requests, date/lane/status filters, edit/create/confirm/decline/cancel/complete, lane reassignment, contact links, internal notes, activity records, recurring/one-time lane blocks, exceptions, special-date hours and owner-editable settings.
- New storage: `reservation_settings`, `lane_reservations`, `lane_occupancy`, `lane_schedule_blocks`, `reservation_date_hours`, `reservation_audit`. Seasonal schedules gain `starts_on`/`ends_on`; expired schedules are hidden publicly without deleting them.
- Pending and confirmed reservations hold lanes. Other statuses release them. Every booking and scheduling RPC locks the same transaction key; overlap is additionally prevented by a lane/time-range exclusion constraint. Direct client writes are revoked, staff RPCs check roles, and public reads never expose customer records.
- Configurable 1–5 game defaults, exact provisional per-lane ranges, longest-lane duration, upper/lower estimate choice, buffers, weekly windows, advance limits and lead time.

## Verification
- 17 duration/allocation tests plus 10 isolated database integration tests and 10 existing login/pricing tests passed (37 total).
- Database integration tests apply the actual migrations to a disposable PostgreSQL instance, including simultaneous attempts for the last lane, full duration, partial capacity, recurring/maintenance blocks, date-hours override, privacy/grants, invalid inputs, staff reassignment/cancellation and inquiry separation.
- Real hosted staff browser flow: reservation created and read back, cancelled and read back; lane block created and removed. Separate inquiry submitted successfully. Clearly labelled test records removed afterwards.
- Public disabled state and signed-in staff schedule/editor checked in the browser. Public enabled booking success against the hosted database remains intentionally unverified: reservations have not been enabled before owner review.
- The isolated database uses a minimal auth helper; hosted account/role permissions remain the existing Cloud policies and are additionally checked by RPC. No accounts or existing roles were changed.

## Owner setup required
Online reservations remain **off**. Review bookable windows (initially taken from the verified public bowling hours), league blocks, holidays, private events, estimates, buffers and approval workflow before enabling. Display hours and structured booking windows are separate because free-text display hours are not safe to parse; keep them synchronized when changing operating schedules. Special-date booking windows do not automatically overwrite public display wording; use the existing Hours/Announcements editor for visitor notices.
No reservation email/text provider or newsletter is integrated. On-screen results and the staff queue work without email. A future provider needs verified sender identity, delivery handling, consent/unsubscribe for newsletters and authorized staff notifications. No paid service was added.

## External hosting
Current React/TanStack Start SSR app uses the Lovable Vite configuration and Cloudflare-oriented Nitro target; unchanged to preserve deployment. GoDaddy requires a separately configured Node target, supported Node hosting, startup/reverse proxy/HTTPS, then actual hosting tests. It is not verified ready for GoDaddy.
Required variable names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`; server `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. No service-role key is needed by reservation code.
Lovable Cloud must remain available for content, accounts and booking RPCs. CDN asset pointers for the homepage, 5-pin explainer, league night, parties, glow and snack bar photos must remain reachable, along with Google Fonts. Staff authentication is email/password, not Lovable Google OAuth. Set the future domain and password recovery redirect URLs before moving hosting.

## Re-running tests
Unit tests: `bunx vitest run src/lib/reservations.test.ts src/lib/staff-auth.test.ts src/lib/food-order.test.ts`.
Database tests: `bash scripts/test-reservations-db.sh` as a non-root OS user with PostgreSQL binaries and `btree_gist` available. The script creates and deletes only a new `/tmp` database. Never set `RESERVATION_TEST_DB_URL` to the hosted database.
