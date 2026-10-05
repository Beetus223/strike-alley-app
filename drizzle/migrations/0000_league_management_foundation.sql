CREATE TABLE public.lm_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_code text NOT NULL UNIQUE,
  name text NOT NULL,
  season text,
  start_date date,
  end_date date,
  bowling_day integer CHECK (bowling_day BETWEEN 0 AND 6),
  start_time text,
  games_per_night integer NOT NULL DEFAULT 4 CHECK (games_per_night BETWEEN 1 AND 6),
  team_count integer,
  bowlers_per_team integer,
  division_count integer NOT NULL DEFAULT 4 CHECK (division_count BETWEEN 0 AND 10),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  public_league_id uuid REFERENCES public.leagues(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_leagues TO authenticated;
GRANT ALL ON public.lm_leagues TO service_role;
ALTER TABLE public.lm_leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm leagues" ON public.lm_leagues FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER lm_leagues_updated_at BEFORE UPDATE ON public.lm_leagues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lm_league_rules (
  league_id uuid PRIMARY KEY REFERENCES public.lm_leagues(id) ON DELETE CASCADE,
  handicap_method text NOT NULL DEFAULT 'not_configured',
  handicap_percent integer,
  handicap_base integer,
  points_with_handicap boolean NOT NULL DEFAULT false,
  game_points numeric,
  series_points numeric,
  team_points numeric,
  match_point_rule text,
  high_block_scratch boolean NOT NULL DEFAULT true,
  high_single_scratch boolean NOT NULL DEFAULT true,
  needs_confirmation boolean NOT NULL DEFAULT true,
  confirmation_notes text,
  custom_rules text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_league_rules TO authenticated;
GRANT ALL ON public.lm_league_rules TO service_role;
ALTER TABLE public.lm_league_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm rules" ON public.lm_league_rules FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER lm_league_rules_updated_at BEFORE UPDATE ON public.lm_league_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lm_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.lm_leagues(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_divisions TO authenticated;
GRANT ALL ON public.lm_divisions TO service_role;
ALTER TABLE public.lm_divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm divisions" ON public.lm_divisions FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TABLE public.lm_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.lm_leagues(id) ON DELETE CASCADE,
  team_number integer,
  name text NOT NULL,
  captain_bowler_id uuid REFERENCES public.bowlers(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_teams TO authenticated;
GRANT ALL ON public.lm_teams TO service_role;
ALTER TABLE public.lm_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm teams" ON public.lm_teams FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER lm_teams_updated_at BEFORE UPDATE ON public.lm_teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lm_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.lm_teams(id) ON DELETE CASCADE,
  bowler_id uuid NOT NULL REFERENCES public.bowlers(id) ON DELETE CASCADE,
  division_id uuid REFERENCES public.lm_divisions(id) ON DELETE SET NULL,
  is_substitute boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, bowler_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_team_members TO authenticated;
GRANT ALL ON public.lm_team_members TO service_role;
ALTER TABLE public.lm_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm team members" ON public.lm_team_members FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TABLE public.lm_league_nights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.lm_leagues(id) ON DELETE CASCADE,
  week_number integer,
  night_date date NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, night_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_league_nights TO authenticated;
GRANT ALL ON public.lm_league_nights TO service_role;
ALTER TABLE public.lm_league_nights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm nights" ON public.lm_league_nights FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER lm_league_nights_updated_at BEFORE UPDATE ON public.lm_league_nights FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lm_matchups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  night_id uuid NOT NULL REFERENCES public.lm_league_nights(id) ON DELETE CASCADE,
  team_a_id uuid REFERENCES public.lm_teams(id) ON DELETE SET NULL,
  team_b_id uuid REFERENCES public.lm_teams(id) ON DELETE SET NULL,
  team_a_name text,
  team_b_name text,
  lanes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_matchups TO authenticated;
GRANT ALL ON public.lm_matchups TO service_role;
ALTER TABLE public.lm_matchups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm matchups" ON public.lm_matchups FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TABLE public.lm_night_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  night_id uuid NOT NULL REFERENCES public.lm_league_nights(id) ON DELETE CASCADE,
  matchup_id uuid REFERENCES public.lm_matchups(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.lm_teams(id) ON DELETE SET NULL,
  bowler_id uuid REFERENCES public.bowlers(id) ON DELETE SET NULL,
  team_name text,
  bowler_name text,
  division_code text,
  average_at_time numeric,
  handicap_at_time integer,
  game_number integer NOT NULL CHECK (game_number BETWEEN 1 AND 6),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 450),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (night_id, bowler_id, game_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lm_night_scores TO authenticated;
GRANT ALL ON public.lm_night_scores TO service_role;
ALTER TABLE public.lm_night_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage lm night scores" ON public.lm_night_scores FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Completed nights are locked: reopen the night first to make corrections.
CREATE OR REPLACE FUNCTION public.lm_block_completed_night()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE nid uuid := COALESCE(NEW.night_id, OLD.night_id);
BEGIN
  IF EXISTS (SELECT 1 FROM public.lm_league_nights WHERE id = nid AND status = 'completed') THEN
    RAISE EXCEPTION 'This league night is completed. Reopen it before making changes.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER lm_night_scores_lock BEFORE INSERT OR UPDATE OR DELETE ON public.lm_night_scores FOR EACH ROW EXECUTE FUNCTION public.lm_block_completed_night();
CREATE TRIGGER lm_matchups_lock BEFORE INSERT OR UPDATE OR DELETE ON public.lm_matchups FOR EACH ROW EXECUTE FUNCTION public.lm_block_completed_night();