REVOKE ALL ON FUNCTION public.generate_bowler_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_score_session() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalculate_player_average() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;