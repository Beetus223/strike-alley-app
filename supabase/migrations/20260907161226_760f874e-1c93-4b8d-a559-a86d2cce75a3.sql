-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'player');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'staff')
  );
$$;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- profile auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'player')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- booking requests
CREATE TYPE public.booking_status AS ENUM ('new', 'confirmed', 'declined', 'completed');

CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  lanes INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status public.booking_status NOT NULL DEFAULT 'new',
  staff_notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.booking_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a booking request" ON public.booking_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read booking requests" ON public.booking_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Staff update booking requests" ON public.booking_requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete booking requests" ON public.booking_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER booking_requests_updated_at BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- leagues
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  night TEXT NOT NULL,
  start_time TEXT NOT NULL,
  season TEXT NOT NULL,
  format TEXT NOT NULL,
  fee TEXT NOT NULL,
  description TEXT,
  handicap_base INTEGER NOT NULL DEFAULT 200,
  handicap_percent INTEGER NOT NULL DEFAULT 80,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leagues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leagues TO authenticated;
GRANT ALL ON public.leagues TO service_role;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leagues are public" ON public.leagues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage leagues" ON public.leagues FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams are public" ON public.teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage teams" ON public.teams FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  total_pinfall INTEGER NOT NULL DEFAULT 0,
  average NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player standings are public" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage players" ON public.players FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  week_date DATE NOT NULL,
  game_number INTEGER NOT NULL CHECK (game_number BETWEEN 1 AND 5),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 450),
  entered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, week_date, game_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players read their own scores" ON public.scores
  FOR SELECT TO authenticated USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.players p WHERE p.id = scores.player_id AND p.profile_id = auth.uid())
  );
CREATE POLICY "Staff manage scores" ON public.scores FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- automatic average recalculation
CREATE OR REPLACE FUNCTION public.recalculate_player_average()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target UUID := COALESCE(NEW.player_id, OLD.player_id);
BEGIN
  UPDATE public.players p
  SET games_played = agg.games,
      total_pinfall = agg.pins,
      average = CASE WHEN agg.games > 0 THEN ROUND(agg.pins::NUMERIC / agg.games, 2) ELSE 0 END
  FROM (
    SELECT COUNT(*) AS games, COALESCE(SUM(score), 0) AS pins
    FROM public.scores WHERE player_id = target
  ) agg
  WHERE p.id = target;
  RETURN NULL;
END;
$$;

CREATE TRIGGER scores_recalculate_average
  AFTER INSERT OR UPDATE OR DELETE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_player_average();

-- seed leagues
INSERT INTO public.leagues (slug, name, night, start_time, season, format, fee, description, handicap_base, handicap_percent, registration_open) VALUES
('monday-mixed', 'Monday Mixed', 'Monday', '7:00 PM', 'September – April', 'Teams of 4, 3 games, handicap 80% of 200', '$18 per bowler, per night', 'Our biggest league. Mixed teams of four bowl three games with handicap.', 200, 80, true),
('tuesday-seniors', 'Tuesday Golden Pins', 'Tuesday', '1:00 PM', 'October – March', 'Teams of 3, 3 games, handicap 90% of 180', '$12 per bowler, per afternoon', 'Afternoon league for bowlers 55 and up.', 180, 90, true),
('thursday-mens', 'Thursday Men''s Classic', 'Thursday', '7:30 PM', 'September – April', 'Teams of 5, 3 games, scratch and handicap divisions', '$20 per bowler, per night', 'The most competitive night on the calendar.', 220, 80, false),
('youth-bowling-canada', 'Saturday YBC Youth', 'Saturday', '9:30 AM', 'September – April', 'Bantam, Junior and Senior divisions, 2 games with coaching', '$11 per bowler, per week', 'Youth Bowling Canada certified coaching for ages 5–18.', 150, 100, true);