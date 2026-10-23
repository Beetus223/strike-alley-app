# Six-lane reservations

## Implemented
- `/book` is telephone-only with the verified number and event/rental links. The retired ordinary customer booking form and public submission wrapper are removed; anonymous regular booking writes are denied.
- `/admin` opens the reservation book: Add Reservation → booking type → essential details → review → Save Reservation, with a visible success message. Regular bookings need no email, use automatic lane assignment and allow adjusted duration.
- Today/day/week/upcoming views, date navigation, six-lane schedule, availability at a selected time, status filters, contact links, changes/cancellations, lane closures, recurring blocks, special-date hours and configurable estimates are retained.
- Special events have separate inquiry/tentative/confirmed/cancelled states, optional email and facility notes. Only staff confirmation with lanes creates occupancy; changing or cancelling the inquiry updates its linked reservation transactionally. Public event requests remain inquiries.
- All reservation writes share transaction locking and lane-range exclusion protection. Staff roles and accounts are unchanged; internal schedules and customer details remain private.

## Verification
- 45 tests passed: 21 duration/allocation/schedule tests, 14 isolated database tests, four staff-auth tests and six existing menu/order-rule tests (no online ordering UI was restored).
- Isolated tests cover simultaneous last-lane attempts, overlap, lane closures, privacy, no anonymous regular bookings, optional staff email, adjusted duration, inquiry creation/confirmation/rescheduling/cancellation and released occupancy.
- Signed-in browser checks verified regular booking creation, review, success and read-back, cancellation and a meeting-room inquiry saved/read back. The two explicitly labelled test records and related reservation audit entries were removed.
- Desktop/mobile layouts, native date/time controls, telephone dialler link and staff form interactions checked; no browser runtime errors observed. No deployment, account or provider changes.

## Owner setup required
Public regular reservations are permanently telephone-only, not a feature awaiting activation. Owner review of bookable windows, league blocks, holidays, special dates, estimates and buffers remains required for staff scheduling. Public display hours and structured booking windows remain separate; keep them synchronized when changing hours.
No reservation email/text provider or newsletter is integrated. No paid service was added.

## External hosting
Current React/TanStack Start SSR app uses the Lovable Vite configuration and Cloudflare-oriented Nitro target; unchanged to preserve deployment. GoDaddy requires a separately configured Node target, supported Node hosting, startup/reverse proxy/HTTPS, then actual hosting tests. It is not verified ready for GoDaddy.
Required variable names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`; server `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. No service-role key is needed by reservation code.
Lovable Cloud must remain available for content, accounts and booking RPCs. CDN asset pointers for the homepage, 5-pin explainer, league night, parties, glow and snack bar photos must remain reachable, along with Google Fonts. Staff authentication is email/password, not Lovable Google OAuth. Set the future domain and password recovery redirect URLs before moving hosting.

## Re-running tests
Unit tests: `bunx vitest run src/lib/reservations.test.ts src/lib/staff-auth.test.ts src/lib/food-order.test.ts`.
Database tests: `bash scripts/test-reservations-db.sh` as a non-root OS user with PostgreSQL binaries and `btree_gist` available. The script creates and deletes only a new `/tmp` database. Never set `RESERVATION_TEST_DB_URL` to the hosted database.
