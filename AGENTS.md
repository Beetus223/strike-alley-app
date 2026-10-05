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
- League statistics are computed client-side in `src/lib/league-stats.ts` from raw `scores` + `league_settings` + `team_matchups`; never store derived stats — individual games are the single source of truth.
- Internal league management lives in `lm_*` tables (separate from public `leagues` listing); completed `lm_league_nights` are locked by trigger and scores store name snapshots so history never rewrites.
- Internal league results (handicap, points, standings, averages, highs) are computed by `src/lib/lm-engine.ts` from raw `lm_night_scores` + `lm_league_rules`; the Staff Dashboard no longer hosts score/report/bowler tools — League Management is the only home.
