# Website content management expansion
- [x] Inventory public pages, existing staff controls, stored content and permissions; present a safe implementation plan.
- [x] Extend the existing content system for page text, central contact details, media, telephone actions and structured packages.
- [x] Expand simple staff editing, preview, visibility, validation and non-destructive archiving while preserving existing layouts.
- [x] Verify drafts/publishing, offerings, existing saves, anonymous restrictions and telephone links; record remaining coverage limits in WEBSITE-MANAGEMENT.md.
- [ ] Direct photo uploads require an owner/admin decision on the workspace public-storage restriction; existing photo selection and HTTPS links work.

# Website refinement and six-lane reservations
- [x] Inspect existing bookings, schedules, access policies and hosting dependencies; present the implementation plan.
- [x] Implement concurrency-safe reservations, configurable duration/rules and lane availability without changing existing inquiry records.
- [x] Add regular reservation flow and separate special-event inquiries; preserve public content and staff authentication.
- [x] Extend staff dashboard with lane schedule, reservation management, blocks and settings.
- [x] Test availability, concurrent bookings, privacy, staff management and existing content; document owner setup and hosting limitations.

# Simple telephone and staff reservation book
- [x] Replace public regular booking form with telephone booking and special-event links; disable public ordinary reservation writes.
- [x] Simplify staff booking types, essential details, review/save and visible success; add staff-managed special inquiries.
- [x] Show daily/weekly/upcoming reservations and event inquiries together while preserving their separate records.
- [x] Verify six-lane conflicts, staff permissions, changes/cancellations, accessibility and existing content; 45 tests and signed-in save/read-back checks passed.
- [ ] Owner review of booking hours, estimates, league blocks and special dates remains required.

# Final staff login
- [x] Verified owner dashboard and Manage Website access; failed role reads now retry and show a recoverable error instead of “Staff only”; browser-tested retry and refresh without permission changes.
- [x] Remove Google sign-in and add secure recovery/password setup.
- [x] Review staff and administrator database permissions without changing accounts.
- [x] Verify safe login and access paths; 10 tests pass. Real password sign-in/recovery completion remains unverified.
- [x] Document owner invitations, authorization, revocation and external hosting requirements in STAFF-HOSTING-READINESS.md.
- [x] Owner onboarding: account created for vegrevillebowling1@hotmail.com via More → Users → Add user; admin role assigned alongside existing player role; staff dashboard verified open with all tabs via test session; test announcement save and delete confirmed her write permissions (no test record left). Owner signed in herself with her own email/password and confirmed everything works. Current administrator/staff accounts preserved.
- [ ] Real recovery email/password test: requires owner sign-in and approved recovery testing.
- [ ] External Node hosting verification: requires selected host/domain and approved hosting configuration changes.