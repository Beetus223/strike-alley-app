ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS team_number integer;

CREATE TABLE public.league_settings (
  league_id uuid PRIMARY KEY REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_label text,
  season_start date,
  season_end date,
  games_per_session integer NOT NULL DEFAULT 3 CHECK (games_per_session BETWEEN 1 AND 5),
  team_size integer CHECK (team_size IS NULL OR team_size BETWEEN 1 AND 10),
  handicap_enabled boolean NOT NULL DEFAULT false,
  handicap_method text NOT NULL DEFAULT 'not_configured',
  handicap_base integer,
  handicap_percent integer,
  handicap_scope text NOT NULL DEFAULT 'individual',
  handicap_basis text NOT NULL DEFAULT 'prior_average',
  absent_rule text NOT NULL DEFAULT 'not_configured',
  absent_value integer,
  vacant_rule text NOT NULL DEFAULT 'not_configured',
  vacant_value integer,
  winloss_method text NOT NULL DEFAULT 'not_configured',
  winloss_use_handicap boolean NOT NULL DEFAULT false,
  series_point boolean NOT NULL DEFAULT false,
  tie_rule text NOT NULL DEFAULT 'tie',
  standings_rule text NOT NULL DEFAULT 'win_pct',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.league_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_settings TO authenticated;
GRANT ALL ON public.league_settings TO service_role;
ALTER TABLE public.league_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "League settings are public" ON public.league_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage league settings" ON public.league_settings FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER league_settings_updated_at BEFORE UPDATE ON public.league_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.team_matchups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.league_sessions(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  opponent_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  manual_wins numeric,
  manual_losses numeric,
  manual_ties numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, team_id)
);
GRANT SELECT ON public.team_matchups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_matchups TO authenticated;
GRANT ALL ON public.team_matchups TO service_role;
ALTER TABLE public.team_matchups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team matchups are public" ON public.team_matchups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage team matchups" ON public.team_matchups FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER team_matchups_updated_at BEFORE UPDATE ON public.team_matchups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();