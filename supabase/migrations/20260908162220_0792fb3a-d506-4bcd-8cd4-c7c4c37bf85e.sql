
-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Special',
  schedule_text TEXT,
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  featured BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage events" ON public.events FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- HOURS
CREATE TABLE public.hours_of_operation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  day_label TEXT NOT NULL,
  open_hours TEXT NOT NULL DEFAULT 'Closed',
  public_bowling TEXT,
  food_service TEXT,
  glow_bowling TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hours_of_operation TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hours_of_operation TO authenticated;
GRANT ALL ON public.hours_of_operation TO service_role;
ALTER TABLE public.hours_of_operation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hours are public" ON public.hours_of_operation FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage hours" ON public.hours_of_operation FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER hours_updated_at BEFORE UPDATE ON public.hours_of_operation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRICING
CREATE TABLE public.pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  price TEXT NOT NULL,
  note TEXT,
  category TEXT NOT NULL DEFAULT 'Walk-in',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_items TO authenticated;
GRANT ALL ON public.pricing_items TO service_role;
ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pricing is public" ON public.pricing_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage pricing" ON public.pricing_items FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER pricing_updated_at BEFORE UPDATE ON public.pricing_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are public" ON public.announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage announcements" ON public.announcements FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LEAGUES EXTRA FIELDS
ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS spots TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE TRIGGER leagues_updated_at BEFORE UPDATE ON public.leagues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEED HOURS (official)
INSERT INTO public.hours_of_operation (day_of_week, day_label, open_hours, public_bowling, food_service, glow_bowling, note) VALUES
 (1,'Monday','5:30 PM – 9:00 PM','5:30 PM – 6:30 PM','5:30 PM – 8:30 PM',NULL,NULL),
 (2,'Tuesday','10:30 AM – 10:00 PM','10:30 AM – 1:00 PM and 3:00 PM – 4:15 PM','10:30 AM – 9:30 PM',NULL,NULL),
 (3,'Wednesday','10:30 AM – 10:00 PM','10:30 AM – 1:00 PM','10:30 AM – 9:30 PM',NULL,NULL),
 (4,'Thursday','10:30 AM – 10:00 PM','10:30 AM – 6:30 PM','10:30 AM – 9:30 PM',NULL,NULL),
 (5,'Friday','10:30 AM – 10:00 PM','10:30 AM – 10:00 PM','10:30 AM – 9:30 PM','7:00 PM – 10:00 PM','We may stay open later for larger reservations or particularly busy nights.'),
 (6,'Saturday','10:30 AM – 10:00 PM','10:30 AM – 10:00 PM','10:30 AM – 9:30 PM','7:00 PM – 10:00 PM','We may stay open later for larger reservations or particularly busy nights.'),
 (0,'Sunday','12:00 PM – 8:00 PM','12:00 PM – 8:00 PM','12:00 PM – 7:30 PM',NULL,NULL);

-- SEED PRICING (existing site values, now editable)
INSERT INTO public.pricing_items (label, price, note, category, sort_order) VALUES
 ('Adult game (13+)','$5.25','per person, per game','Walk-in',1),
 ('Youth / senior game','$4.25','12 and under, 65+','Walk-in',2),
 ('Shoe rental','$3.00','all sizes, kids to size 15','Walk-in',3),
 ('Lane by the hour','$32.00','up to 6 bowlers, shoes extra','Walk-in',4),
 ('Glow bowling (Fri/Sat after 7 PM)','$6.50','per person, per game','Walk-in',5),
 ('Family four-pack','$62.00','2 hours, 4 pairs of shoes, 1 pitcher of pop','Walk-in',6);

-- SEED EVENTS (existing site content, now editable)
INSERT INTO public.events (title, description, category, schedule_text, sort_order) VALUES
 ('Glow Bowl Fridays','Lights down, black lights up, DJ playlist and $6.50 games all night.','Weekly','Every Friday, 7:00 PM – 10:00 PM',1),
 ('Toonie Sunday','$2 shoe rental and half-price games for families with kids 12 and under.','Weekly','Sundays, 12:00 – 4:00 PM',2),
 ('Vegreville Pysanka Open','Our annual 5-pin singles tournament during Pysanka Festival weekend. 64-bowler field, $1,500 top prize.','Tournament','July 11 – 12',3),
 ('Turkey Roll','Roll a triple strike and take home a frozen turkey. Doubles format, all ages.','Seasonal','December 13, 6:00 PM',4);

-- BACKFILL league spots from current site copy
UPDATE public.leagues SET spots = CASE slug
  WHEN 'monday-mixed' THEN '2 team spots open'
  WHEN 'tuesday-seniors' THEN 'Open to all — spares always welcome'
  WHEN 'thursday-mens' THEN 'Wait list'
  WHEN 'youth-bowling-canada' THEN 'Registering now'
  ELSE spots END,
  sort_order = CASE slug
  WHEN 'monday-mixed' THEN 1 WHEN 'tuesday-seniors' THEN 2
  WHEN 'thursday-mens' THEN 3 WHEN 'youth-bowling-canada' THEN 4 ELSE 0 END;
