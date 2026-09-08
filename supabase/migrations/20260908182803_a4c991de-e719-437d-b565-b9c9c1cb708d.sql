CREATE TABLE public.bowlers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bowler_id text NOT NULL UNIQUE,
  user_id uuid UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bowlers TO authenticated;
GRANT ALL ON public.bowlers TO service_role;

ALTER TABLE public.bowlers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage bowlers" ON public.bowlers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Bowlers read own record" ON public.bowlers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER bowlers_updated_at BEFORE UPDATE ON public.bowlers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_bowler_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE candidate text;
BEGIN
  LOOP
    candidate := 'VB-' || lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bowlers WHERE bowler_id = candidate);
  END LOOP;
  RETURN candidate;
END; $$;

GRANT EXECUTE ON FUNCTION public.generate_bowler_id() TO authenticated;

CREATE TABLE public.league_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, session_date)
);

GRANT SELECT ON public.league_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_sessions TO authenticated;
GRANT ALL ON public.league_sessions TO service_role;

ALTER TABLE public.league_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "League sessions are public" ON public.league_sessions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Staff manage league sessions" ON public.league_sessions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER league_sessions_updated_at BEFORE UPDATE ON public.league_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.players ADD COLUMN bowler_ref uuid REFERENCES public.bowlers(id) ON DELETE CASCADE;
ALTER TABLE public.players ADD COLUMN is_active boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX players_bowler_league_uniq ON public.players (bowler_ref, league_id)
  WHERE bowler_ref IS NOT NULL;

ALTER TABLE public.scores ADD COLUMN session_id uuid REFERENCES public.league_sessions(id) ON DELETE CASCADE;

INSERT INTO public.league_sessions (league_id, session_date)
SELECT DISTINCT league_id, week_date FROM public.scores
ON CONFLICT (league_id, session_date) DO NOTHING;

UPDATE public.scores s
SET session_id = ls.id
FROM public.league_sessions ls
WHERE ls.league_id = s.league_id AND ls.session_date = s.week_date AND s.session_id IS NULL;

CREATE OR REPLACE FUNCTION public.attach_score_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  IF NEW.session_id IS NULL THEN
    INSERT INTO public.league_sessions (league_id, session_date)
    VALUES (NEW.league_id, NEW.week_date)
    ON CONFLICT (league_id, session_date) DO UPDATE SET session_date = EXCLUDED.session_date
    RETURNING id INTO sid;
    NEW.session_id := sid;
  ELSE
    SELECT ls.league_id, ls.session_date INTO NEW.league_id, NEW.week_date
    FROM public.league_sessions ls WHERE ls.id = NEW.session_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER scores_attach_session BEFORE INSERT OR UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.attach_score_session();

CREATE UNIQUE INDEX IF NOT EXISTS scores_player_session_game_uniq
  ON public.scores (player_id, week_date, game_number);