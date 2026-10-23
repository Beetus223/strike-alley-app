# Complete staff website management

## Audit findings

The existing website and staff dashboard will be extended, not rebuilt.

| Public page or area | Editable now | Missing controls |
|---|---|---|
| Home | Announcements, events, pricing, league listings, displayed hours | Main heading, introduction, activity descriptions, feature text, photos, button labels and visibility, quick facts |
| Bowling & Prices | Price entries | Page introduction, bowling/facility information, supporting text and actions |
| Glow Bowling | Shared business details only through source defaults | Heading, text, schedule description, photo and actions |
| Parties & Group Bookings | None of its packages | Structured packages, inclusions, guest guidance, prices, lane/seating options, supporting text, photo and telephone actions |
| Rentals | None of its offerings | Offering descriptions, prices, facility details and terms; existing claims require owner review |
| Book a Lane | Telephone-only page already works | Heading, introduction, six informational event categories, visibility and call labels |
| Leagues | Names, descriptions, nights, seasons, formats, fees, registration visibility | Surrounding page text and contact instructions |
| Events | Titles, descriptions, dates, category, display order and visibility | Images, featured control, archiving and date validation |
| Announcements | Titles, messages, dates and visibility | Featured control, optional images, archiving and date validation |
| Hours | Regular weekly hours; editing existing seasonal schedules | Create new special schedules, holiday/closure notices, coordinated booking-hours management |
| Snack Bar | Items, descriptions, categories, numeric prices, images, availability, archive/restore | Category notes, page text/photo, independently managed snack-bar phone, clearer validation and saving feedback |
| About / Facility Information | None | Appropriate business history, descriptions and verified facility information |
| Contact / shared header and footer | Live hours | Central telephone, snack-bar telephone, email, address, map location, tagline and appropriate contact text |
| Existing inquiry page | Public submission form remains reachable | Replace public submission with telephone contact; keep private staff inquiry records and management |

The staff dashboard currently has Events, Leagues, Hours, Pricing, Announcements, Snack Bar Menu and Bookings. Existing content is stored in its corresponding tables; reservations and staff-entered inquiries already have separate protected records. Legacy league-management and food-order records remain untouched.

### Issues to address
- Some existing public-read permissions allow hidden content to be fetched directly even though public pages filter it out. Enforce public visibility in the database while retaining staff read access.
- Several new-entry forms clear immediately, before saving succeeds. Keep input until a confirmed save, prevent repeated submissions, and display errors clearly.
- Homepage promotional copy contains prices separate from the official pricing/package records. Remove duplicate price sources by displaying the managed structured values wherever prices appear.
- Existing rental prices, terms and facility claims are legacy content, not newly verified facts. Preserve their records for owner review; unsupported claims must not be newly published as verified offerings.

## What will be built

### 1. Clear, accessible dashboard organization
Keep Bookings intact and add a **Manage Website** area. Reuse the current content editors for Events, Announcements, Hours, Pricing, Leagues and Snack Bar. Add Home Page, Birthday Packages, Group Events and Rentals, Facility Information, Contact Information and Book a Lane editors. These cover the existing public pages without inventing new offerings or unnecessary pages.

Use short forms, large labelled controls, visible focus, readable spacing, inline validation, explicit Save Changes and Cancel actions, visible save/error messages, and confirmation for removal. Provide clear links to the corresponding public page.

### 2. Central contact and fixed-layout page content
Make business contact details a single source used by all public pages, the header/footer, maps and telephone buttons. Keep the snack-bar number separate because it currently differs from the bowling number.

Move appropriate existing page text, photo slots, button labels, permitted destinations and visibility into staff-editable fields. Staff see ordinary labelled fields—not code or JSON. Retain existing page dimensions, layouts, crops, fonts, colors and navigation. Bowling rules and physical lane limits remain protected application facts.

Allow image replacement through a supported upload/selection control, with preview and alternative-text fields. Preserve current images as initial content. Restrict link destinations to safe, supported choices; all regular and special-event booking actions use the central telephone number.

### 3. Structured packages, pricing and special-event content
Provide package names, descriptions, numeric CAD prices, pricing notes, value notes, guest guidance and ordered inclusion rows. Support add, edit, duplicate, reorder, hide, restore and archive. Preview changes before publishing; existing verified package values and inclusions are preserved exactly.

Make every public price come from the managed pricing, package, rental or menu records. Keep descriptive fee notes separate where practical. Preserve legacy information for review rather than invent replacements.

Manage existing event categories for birthday parties, groups/fundraisers, corporate events, private rentals, meeting rooms and other events. Facility claims must be confirmed before newly publishing an offering. Replace public inquiry-form destinations and the public inquiry form with telephone contact; keep staff-entered event inquiries and linked reservations working.

### 4. Strengthen existing editors
Add consistent required-field, date-order, numeric price and image validation, featured/image controls where applicable, non-destructive archival and reliable saving feedback. Add creation of seasonal/holiday schedules and one-off closures using the existing hours/scheduling models. Coordinate public display hours with structured booking windows without interpreting free-text hours automatically.

Keep leagues informational and the snack bar view-only. Do not restore retired account, scoring or ordering screens.

### 5. Safe previews and publication
For newly editable page content and packages, keep draft changes separate from the published version so previews do not leak publicly. Publish only after validation and successful storage. Existing public content starts published with its current visibility. Staff can read their unpublished content; public visitors cannot.

## Technical approach
- Reuse the existing purpose-specific content tables and hooks; do not replace them with a second content system.
- Add only the missing structures: central business settings, constrained fixed-layout page/section content, structured offerings and ordered package features. Existing pricing/menu/hour/league records stay authoritative.
- Use additive migrations with explicit grants, row-level security and staff-only writes. Apply public visibility rules consistently to existing and new content while preserving staff access.
- Use the existing authenticated server-function and database authorization patterns for validated changes; no new authentication providers, accounts or permission assignments.
- Keep layouts in React; store only bounded, validated content and supported settings. No executable HTML or arbitrary scripts.
- Record architecture rules in AGENTS.md and retain the audit/coverage checklist in a project document.

## Verification and completion report
- Test each editor opening existing data, correcting invalid input, saving, publishing, hiding/restoring and reading the result on its public page.
- Verify changes in an authenticated staff session and check public reads separately. Use clearly labelled temporary content, restore originals and remove only test-created records after testing.
- Add focused tests for price validation, visibility/draft privacy, safe links, phone-only booking actions, date ranges and staff authorization.
- Check desktop, tablet and mobile editing/display, keyboard access, image rendering and telephone destinations.
- Run existing relevant tests and inspect preview errors; preserve the six-lane conflict safeguards and staff sign-in.
- Report exactly which fields are editable and verified, plus any remaining hard-coded or unsupported fields. No claim of universal editability without coverage checks.

## Boundaries
No deployment, domain changes, database reset, dropped tables, deletion of existing business records, account removal, authentication-provider changes, invented business rules, public booking forms or online ordering. Actual prices and contact details remain the existing values until the owner changes or verifies them. Password-recovery testing and external hosting remain separate pending tasks.