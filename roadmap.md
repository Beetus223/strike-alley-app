# Website refinement and six-lane reservations
- [x] Inspect existing bookings, schedules, access policies and hosting dependencies; present the implementation plan.
- [x] Implement concurrency-safe reservations, configurable duration/rules and lane availability without changing existing inquiry records.
- [x] Add regular reservation flow and separate special-event inquiries; preserve public content and staff authentication.
- [x] Extend staff dashboard with lane schedule, reservation management, blocks and settings.
- [x] Test availability, concurrent bookings, privacy, staff management and existing content; document owner setup and hosting limitations.

- [ ] Enable public reservations: owner must review booking windows, league blocks, holidays, estimates and approval settings first.
- [ ] Hosted public booking success: blocked until owner approves enabling; concurrency/submission rules passed isolated database tests.

# Final staff login
- [x] Remove Google sign-in and add secure recovery/password setup.
- [x] Review staff and administrator database permissions without changing accounts.
- [x] Verify safe login and access paths; 10 tests pass. Real password sign-in/recovery completion remains unverified.
- [x] Document owner invitations, authorization, revocation and external hosting requirements in STAFF-HOSTING-READINESS.md.
- [x] Owner onboarding: account created for vegrevillebowling1@hotmail.com via More → Users → Add user; admin role assigned alongside existing player role; staff dashboard verified open with all tabs via test session; test announcement save and delete confirmed her write permissions (no test record left). Owner signed in herself with her own email/password and confirmed everything works. Current administrator/staff accounts preserved.
- [ ] Real recovery email/password test: requires owner sign-in and approved recovery testing.
- [ ] External Node hosting verification: requires selected host/domain and approved hosting configuration changes.