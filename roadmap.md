# Roadmap

- [x] Investigate 9 RLS findings; dropped unused public reads (players, teams, team_matchups, league_settings, league_sessions, ordering_settings) and open booking insert; kept intentional public reads (hours, website_content)
- [x] website-photos warning: expected by design (published-reference-only public reads, staff-only writes); photos verified loading on Lovable + Cloudflare; ignore proposed to user
- [x] Unsubscribe investigation: Jonah's click never reached the server; mechanism proven working (fake token correctly rejected, relay 200)
- [x] Newsletter cleanup: test subscriber + events + spam counters removed; draft preserved; all email sending + bulk disabled
- [x] Tests (77 pass) + security rescan (7 findings cleared, 2 info ignored as intentional)
- [x] Lovable republish scheduled; Cloudflare deploy follows via GitHub sync of commit 0ed602e; bridge re-verified with dummy signup (no email sent)
