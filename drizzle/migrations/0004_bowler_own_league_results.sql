-- Read-only, self-scoped access for bowlers to their own League Management data. No table grants change.
CREATE OR REPLACE FUNCTION public.my_lm_memberships()
RETURNS TABLE (league_id uuid, league_name text, season text, handicap_method text, handicap_percent integer, handicap_base integer, games_per_night integer, team_name text, entering_average numeric, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.name, l.season, r.handicap_method, r.handicap_percent, r.handicap_base, l.games_per_night, t.name, tm.entering_average, tm.is_active
  FROM public.bowlers b
  JOIN public.lm_team_members tm ON tm.bowler_id = b.id
  JOIN public.lm_teams t ON t.id = tm.team_id
  JOIN public.lm_leagues l ON l.id = t.league_id
  LEFT JOIN public.lm_league_rules r ON r.league_id = l.id
  WHERE b.user_id = auth.uid() AND auth.uid() IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.my_lm_scores()
RETURNS TABLE (league_id uuid, league_name text, night_id uuid, night_date date, week_number integer, team_name text, game_number integer, score integer, average_at_time numeric, handicap_at_time integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.name, n.id, n.night_date, n.week_number, s.team_name, s.game_number, s.score, s.average_at_time, s.handicap_at_time
  FROM public.bowlers b
  JOIN public.lm_night_scores s ON s.bowler_id = b.id
  JOIN public.lm_league_nights n ON n.id = s.night_id AND n.status = 'completed'
  JOIN public.lm_leagues l ON l.id = n.league_id
  WHERE b.user_id = auth.uid() AND auth.uid() IS NOT NULL
  ORDER BY n.night_date DESC, s.game_number
$$;

REVOKE ALL ON FUNCTION public.my_lm_memberships() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_lm_scores() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_lm_memberships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_lm_scores() TO authenticated;