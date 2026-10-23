# Six-lane reservations and website refinement

## What stays unchanged
- Preserve the current website design, photos, staff email/password sign-in, administrator/staff roles, accounts, public content and historical records.
- Keep leagues informational and the snack bar view-only. Do not restore bowler accounts, scoring tools, food ordering or payments.
- Do not deploy, change the live domain or switch the hosting target.

## Inspection findings
- The current booking page submits inquiries with a preferred date/time; it does not calculate duration, assign lanes or check availability.
- Its lane input currently permits eight lanes, and an outdated note mentions lanes 1–8. The new flow will consistently use the six physical lanes.
- Staff approval is the existing workflow. Preserve it: a successful request is pending, not a confirmed reservation.
- Regular public-bowling windows are stored in the existing hours table, including Tuesday’s two separate windows. Seasonal schedules use free-text date labels; the active summer schedule is explicitly dated 2025 and must not automatically apply to future years.
- Existing content edits and staff permissions already use the shared database. Extend that system rather than replacing it.

## 1. Reliable reservation foundation
- Keep existing `booking_requests` records and their inquiry meaning. Add dedicated regular reservations with related assigned-lane records, audit history, structured scheduling settings, and schedule blocks.
- Track Lane 1 through Lane 6 independently. Pending requests will hold allocated lanes until staff confirms, declines or cancels them; disclose this workflow clearly. Confirmation retains the allocation rather than attempting a second booking.
- Validate date, time, bowlers, games, allocations, duration, hours, blocks and staff permissions in database-backed server operations.
- Serialize conflicting scheduling operations and enforce non-overlapping lane occupancy in the database. Submission, staff edits, lane reassignment and new blocks all use the same conflict checks. Never move or cancel another reservation silently.
- Give public visitors access only to safe settings, available times and submission results—not reservation lists, customer details or internal notes.

## 2. Customer booking and separate inquiries
- Replace `/book` with a concise regular-bowling flow: date → bowlers/games/lanes → allocation → available time → contact details → review → actual submission result.
- Offer 1–5 games initially. Balance bowlers across lanes automatically, allow allocation adjustments, and require 1–6 bowlers per selected lane with matching totals.
- Use your exact provisional estimates, multiplied by games. Schedule using the upper end of the longest lane estimate plus configurable buffers. Display the range as an estimate, not a guarantee.
- Recheck availability on submission; if capacity changes, show a clear conflict and refresh genuinely available alternatives.
- Add a separate Special Events and Group Inquiries page for parties, fundraisers, rentals and other arrangements. Save these to the retained inquiry system without reserving lanes.
- Update navigation and relevant booking links while preserving party packages and other useful content.

## 3. Staff schedule and reservation management
- Extend `/admin` with a six-lane daily schedule, date/lane/status filters and reservation details.
- Allow staff to create, confirm, decline, cancel and edit reservations; assign/reassign lanes; add internal notes; and contact customers through phone/email links.
- Show bowlers, games, allocations, expected duration, status, assigned lanes and audit information.
- Keep special inquiries separately identifiable and manageable, including any existing records.
- Add one-time blocks, maintenance, full-day closures, private-event blocks and recurring league blocks with date ranges, affected lanes and date exceptions.
- Reject conflicting edits and blocks with an explanation. Ask for confirmation before consequential changes.

## 4. Owner-editable scheduling and content
- Add settings for game choices, the six duration ranges, scheduling policy, buffers, bookable windows, booking horizon and approval workflow.
- Initialize structured weekly windows from verified public-bowling hours. Show them for owner review; do not infer league blocks from unverified listings.
- Support dated special hours and closures. Extend seasonal schedules with structured dates where necessary without guessing dates or overwriting existing records.
- Keep online reservations disabled until the owner verifies bookable hours, exceptions and blocks. The completed system can be safely tested before public activation.
- Preserve existing event, league, hours, pricing, announcement and menu editors; ensure published content is displayed from the shared database and unpublished content is not publicly exposed.
- Correct only demonstrably inconsistent booking-related copy; do not invent business prices, policies or contact details.

## 5. Verification and delivery
- Add and run focused tests for all supplied duration values, six-lane limits, unequal allocations, interval/buffer handling and scheduling overrides.
- Test partial/full occupancy, individual maintenance blocks, recurring blocks, closures, conflicting edits and simultaneous attempts at the last available lane against real database operations.
- Exercise a public booking and the authenticated staff management flow, verify privacy and unauthorized access rejection, then remove only clearly identified test records.
- Verify a staff content edit appears publicly, special inquiries do not occupy lanes, and retained authentication/pages work on desktop and mobile.
- Check automatic build results and run available tests; report failures or unverified scenarios explicitly.
- Document new tables/migrations, conflict prevention, owner setup, environment-variable names and dependencies. Do not claim GoDaddy readiness without testing on the selected host.

## Technical approach
- Retain React, TypeScript, TanStack Start and the current deployment configuration.
- Use TanStack server functions for application operations, authenticated middleware for staff actions, and narrow public read/submission operations backed by database validation.
- Use additive migrations with explicit grants and row-level access rules. Keep customer information staff-only. No role mutation or account-management endpoints are added.
- Keep calculation, server-operation and staff/customer presentation modules separate, with focused tests and recorded architecture rules.
- Retain Lovable Cloud for database/auth, existing hosted images and fonts. No paid notification service is added.

## Setup and limitations
- Owner review of bookable windows, league blocks, special dates and booking rules is required before enabling public reservations.
- Without an integrated notification provider, customers receive on-screen results and staff see requests in the dashboard; no email or text delivery is claimed.
- Newsletter delivery remains outside this build: document consent, unsubscribe and provider requirements without adding a nonfunctional form.
- Real password-recovery email testing and external Node hosting remain separate outstanding tasks requiring the appropriate approval or hosting details.