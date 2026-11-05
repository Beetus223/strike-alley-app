# Roadmap

- [ ] Investigate 9 RLS findings (players, team_matchups, teams, ordering_settings, booking_requests, league_settings, league_sessions, hours_of_operation, website_content); explain before changing; apply least-privilege where data is not intentionally public
- [ ] Investigate website-photos storage warning; keep published images working on Lovable + Cloudflare; staff-only write
- [ ] Verify whether Jonah's unsubscribe was recorded; do not delete test subscriber until verified
- [ ] After verification: newsletter cleanup (remove test subscriber + spam counters, preserve audit history + draft), keep all email sending + bulk disabled
- [ ] Run security scan + tests after fixes
- [ ] Republish Lovable + trigger Cloudflare deployment; verify bridge still works without sending emails
- [ ] Final status report: resolved vs. needs further action
