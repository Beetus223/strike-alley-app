<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Public site is informational: League Management, online food ordering, Kitchen queue and bowler score dashboards were removed from the UI; their `lm_*`/`food_orders` tables and functions are intentionally left in the database (not dropped) until confirmed unneeded.
- Staff edit all public content (events, leagues, hours, pricing, announcements, snack bar `menu_items`, booking requests) in tabs on `/admin`; public pages read the same tables via `src/lib/content.ts` / `SnackBarMenu`, so there is one content system.
- `/auth` uses existing Cloud email/password authentication; `/reset-password` is public but requires a provider recovery/invitation session validated by `getUser()` before password updates. Shared auth state owns recovery detection and cache teardown so normal sign-in cannot enter password setup.
- Bowler-account server functions and UI are retired; retained content uses existing tables and roles, with no account creation or role mutation endpoints in the application.
- Regular lane reservations use dedicated occupancy records and transaction-locked RPC writes, while special-event inquiries retain booking_requests; this preserves historical inquiry meaning and enforces lane-level overlap safety.
- Booking availability uses structured owner-editable windows rather than parsing free-text display hours; keep both schedules synchronized when changing business hours.
- Database integration tests run only against a disposable local PostgreSQL database with actual reservation migrations; this verifies concurrency without changing hosted customer data.
