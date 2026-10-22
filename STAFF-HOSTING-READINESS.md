# Staff login and external hosting readiness

## Implemented
- Staff email/password only; Google broker imports and button removed from the login page. The generated integration/package remains unused and unmodified.
- No public registration, PIN login, account creation, role changes or password changes performed by this work.
- Forgot password sends the provider's recovery request to the current origin plus `/reset-password`, with neutral feedback that does not disclose account existence.
- The public password setup page requires a provider recovery/invitation flow and a user verified by `getUser()`. Normal signed-in sessions cannot use that page to change passwords. The provider enforces password strength and validates recovery tokens; no current password is sent for recovery.
- Shared auth state prevents roles from a previous user carrying into a different session. Sign-out cancels/clears cached data before signing out and replaces the current page with staff sign-in.
- Existing staff dashboard/content save paths are unchanged; no database schema, policies, data, accounts or live domain changed.

## Verified permission findings (live read-only inspection)
- Row-level security is enabled on all retained content, profiles, roles and booking-request tables.
- Content writes require `private.is_staff(auth.uid())`, whose database definition looks for `admin` or `staff` in the separate `user_roles` table.
- Role table has only a SELECT policy. Ordinary authenticated clients cannot grant/revoke any role, including administrators. Database role changes currently require a trusted project/backend operator; there is no role-management dashboard.
- The signup lifecycle function creates a profile and a `player` role only; it never assigns staff/admin from user metadata.
- Booking SELECT is permitted for staff **or the account that created that request**; it is not strictly staff-only. Anonymous users cannot read requests. Staff can update requests; only admins can delete them.
- Public SELECT policies for several content tables allow inactive rows too. The public application filters display states, but inactive content is not confidential at the database boundary. No policy changes were made.
- Current role counts include one admin and one staff account; neither was altered.

## Owner and staff onboarding (requires approval before execution)
1. Keep the existing administrator in place.
2. Use More → Users → Add user → Send invitation for the owner's real email. The owner chooses their own password; never share passwords or put them in chat. Set the invitation return address to the site's `/reset-password` page where supported.
3. A trusted backend operator explicitly grants that verified account `admin` in `user_roles` after approval. Inviting or signing in does not grant management access automatically.
4. The owner must accept the email, set their password, sign in, and verify dashboard access and one approved content save before any existing admin is demoted/removed.
5. Invite each staff member individually and explicitly authorize `staff`. Revoke an individual's `staff` and `admin` role entries through a trusted backend operator; the database then rejects new management requests without others changing passwords. The existing browser may display stale controls until reloaded, but database writes remain checked on every request.
6. No owner account was created or tested in this task. No invitation, password-reset email or password change was sent/performed during testing.

## Before external hosting
- Email/password and recovery use existing Cloud Auth directly, not Lovable's Google broker. They can work on another frontend host while Lovable Cloud and authentication-email delivery remain active.
- Verified current Site URL is `https://strike-alley-app.lovable.app`; current redirect allowlist covers Lovable preview/published addresses only. No external production address is configured.
- Once the production HTTPS address is known, set Site URL and add the production origin ending in `/**` under More → Users → Auth settings → Advanced. Include the `/reset-password` path for recovery/invitations. Do not change settings before the migration is ready.
- Check Email settings for minimum password requirements, signup restrictions and email delivery. Email/password was already enabled; confirmation, signup restrictions, HIBP and anonymous-auth settings were not changed and were not independently verified.
- The app contains no registration form, but that alone does not prove provider signup is disabled. If required, disable public signup in Auth settings after reviewing existing settings.
- Serve HTTPS; preserve same-origin session storage, direct refresh/navigation to `/auth`, `/admin` and `/reset-password`, and outbound access to Cloud Auth/database APIs. Email links opened on another device must complete through the provider-supported session flow.
- Cloud Auth/database and Lovable-hosted photos (home lanes, 5-pin explanation, league night, parties, glow bowling and snack bar) must remain available. Google Fonts must also remain reachable. Generated Lovable preview-storage/error-reporting code and build helper still exist; removing Google is not complete platform independence.

## Hosting/build configuration
- The current project uses React 19, TypeScript, TanStack Start, Tailwind v4 and Vite **8.1.5** as declared in the current package file (earlier audit reports of Vite 7 are outdated).
- `vite.config.ts` uses the Lovable config helper with a default Cloudflare target. It was intentionally not changed.
- For GoDaddy, use a plan capable of running a persistent Node.js server, not static/shared PHP hosting. In an external copy, use a compatible Node/Nitro server preset, preserve TanStack/React/Tailwind plugins and the custom server entry, then verify the actual emitted startup file before configuring a process manager and reverse proxy. Do not assume `.output/server/index.mjs` until that target is built and inspected.
- Confirm supported Node version from the installed build packages and the chosen host. Provision browser settings at build time and server settings at runtime; route refreshes must reach the app server, not static 404s.
- Required environment names: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; current configuration also includes `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`. No retained feature imports the privileged admin client; no service-role key is needed for ordinary content/login.
- Export source through the connected repository; never export private secrets or generated dependencies/build output as source. Code export does not move Cloud data, accounts, policies or images.

## Test evidence and limits
- 10 tests pass: 6 existing food formatting/ordering utility tests and 4 staff authentication rule tests.
- Browser: real incorrect email/password rejected; no Google/Bowler ID option; recovery request return path and neutral confirmation verified using a mocked response (no email sent); signed-out dashboard redirects; real injected staff session opens all seven tabs; ordinary staff session cannot reset without a recovery flow; sign-out clears dashboard access; zero runtime errors observed.
- Earlier hosting-preparation work verified an announcement save → public page read → removal. This task does not repeat data changes; retained save/read implementations are unchanged.
- **Not end-to-end verified:** successful email/password sign-in with a real password, actual recovery/invitation email delivery and password update, new owner/admin onboarding, unauthorized signed-in role escalation attempts, external-host Node build or GoDaddy operation. These require approved accounts/actions or the eventual host/domain. A managed authenticated session is not proof of password login.
- Build/typecheck run automatically by the preview harness; manual production builds/typechecks were not run. Check the newest harness build result before reporting completion.
- No deployment or domain/database-record/account change was made.