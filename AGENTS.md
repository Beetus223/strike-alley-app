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
