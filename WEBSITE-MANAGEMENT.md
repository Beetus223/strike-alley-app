# Website management inventory and verification

## Existing content retained
Events, public league listings, regular/seasonal hours, prices, announcements and snack bar items remain in their existing tables and dashboard tabs. Bookings retain the separate staff reservation book and staff-entered special-event inquiries. Old league/scoring/ordering data, accounts and roles were not removed.

## New staff controls
Manage Website covers home, about/facility information, bowling/prices page text, glow, parties, rentals, leagues page text, snack bar page text/notes, events page text, announcements page text, hours page text, contact/business information and Book a Lane. Fields include headings, paragraphs, image alternatives, button labels, supported visibility controls and home activity destinations selected from existing public pages. Physical lane count and core 5-pin rules remain protected.

Shared telephone numbers, address, email, map search and business wording are centrally edited in Contact Information. The main bowling and snack bar numbers remain separate. Booking actions use telephone links; public inquiry submissions are retired. Existing staff-entered inquiry records and functions are preserved.

Packages & Rentals stores birthday packages, party lane options and rental offerings as structured records with CAD prices, notes, guest guidance, included features, feature reordering, display order, duplication, preview, verification, hide, archive and restore. Legacy rental records are private until staff verify their facilities, prices and terms; no new facility claims were invented.

## Publishing and previews
Page-copy drafts are staff-only. Publish Changes promotes the selected section to the public content store. Existing events/leagues/hours/prices/menu editors retain direct saving; offerings publish when their verified/published controls are selected. Previews show proposed text, images and offering details, not an exact fully styled page simulation. Public CMS content and verified offerings are loaded for the initial server render.

## Verified
- Authenticated staff saved a page draft; anonymous public page did not show it. Publishing displayed it, then the original heading was restored.
- A labelled temporary package appeared publicly at $123.45 and disappeared when archived. Only that verification record was subsequently removed.
- Existing event, league, pricing, Monday hours and menu item saves succeeded with unchanged values.
- Anonymous draft reads and content writes/publish attempts were denied; signed-out staff-page access went to sign-in.
- Invalid phone input displayed an error and remained in the form for correction.
- Public page sweep passed on desktop and mobile; telephone links and published packages were present with JavaScript disabled.
- 43 focused unit tests passed; preview compilation reported build OK.

## Limitations and owner review
- Direct photo uploads are blocked by the workspace public-storage policy. Staff can select existing photos or supply a secure hosted image link. Uploading from their device is not implemented; it requires an owner/admin storage-policy decision.
- Layout, navigation structure, typography, colours, physical capacity, application logic and SEO metadata are developer-managed. Page sections are fixed; staff cannot add arbitrary new page layouts.
- Home activity button destinations are selectable; booking destinations remain deliberately telephone-only. Other internal navigation destinations stay fixed. Visibility is offered for supported actions/categories and structured entries, not every individual paragraph.
- Existing legacy hours/events/leagues/prices still have bundled loading fallbacks; these are not a second staff editor and may appear during loading or service failure. Full server-fed loading for all older content tables was not part of this expansion.
- Existing category menu notes are editable; adding new menu categories does not automatically create a new separate category-note editor.
- Holiday/seasonal public display and reservation availability remain distinct. Staff must update Bookings → Hours & lane closures as well when operational hours change; no parsing of free-text display hours occurs.
- Existing table save checks verified unchanged records. Full add/edit/hide/restore cycles for every legacy editor, a completed holiday-hours cycle and a non-staff authenticated role test were not repeated; no claim of universal workflow coverage is made.
- Owner review of public email, legacy prices/league details, rental facilities/terms and booking windows remains required. No deployment, account or auth-provider change occurred.
