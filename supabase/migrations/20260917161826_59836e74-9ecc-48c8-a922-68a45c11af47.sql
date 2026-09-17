CREATE TABLE public.seasonal_hour_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date_label TEXT NOT NULL,
  reservation_notice TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seasonal_hour_schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasonal_hour_schedules TO authenticated;
GRANT ALL ON public.seasonal_hour_schedules TO service_role;
ALTER TABLE public.seasonal_hour_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seasonal hour schedules are public" ON public.seasonal_hour_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage seasonal hour schedules" ON public.seasonal_hour_schedules FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER seasonal_hour_schedules_updated_at BEFORE UPDATE ON public.seasonal_hour_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.seasonal_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.seasonal_hour_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_label TEXT NOT NULL,
  food_service TEXT,
  bowler_hours TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, day_of_week)
);
GRANT SELECT ON public.seasonal_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasonal_hours TO authenticated;
GRANT ALL ON public.seasonal_hours TO service_role;
ALTER TABLE public.seasonal_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seasonal hours are public" ON public.seasonal_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage seasonal hours" ON public.seasonal_hours FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER seasonal_hours_updated_at BEFORE UPDATE ON public.seasonal_hours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

WITH summer AS (
  INSERT INTO public.seasonal_hour_schedules (title, date_label, reservation_notice, is_active, sort_order)
  VALUES ('SUMMER PUBLIC BOWLING HOURS', 'July 1 – August 31, 2025', 'RESERVATION ONLY', true, 1)
  RETURNING id
)
INSERT INTO public.seasonal_hours (schedule_id, day_of_week, day_label, food_service, bowler_hours, note)
SELECT summer.id, day_of_week, day_label, food_service, bowler_hours, note
FROM summer
CROSS JOIN (VALUES
  (1, 'Monday', 'CLOSED', NULL::TEXT, NULL::TEXT),
  (2, 'Tuesday', '10:30 a.m. – 8:30 p.m.', 'Until 9:30 p.m.', 'Take out or eat in.'),
  (3, 'Wednesday', '10:30 a.m. – 8:30 p.m.', 'Until 9:30 p.m.', 'Take out or eat in.'),
  (4, 'Thursday', '10:30 a.m. – 8:30 p.m.', 'Until 9:30 p.m.', 'Take out or eat in.'),
  (5, 'Friday', '10:30 a.m. – 8:30 p.m.', 'Until 9:30 p.m.', 'Take out or eat in.'),
  (6, 'Saturday', '11:00 a.m. – 8:00 p.m.', 'Until 9:30 p.m.', 'Take out or eat in.'),
  (0, 'Sunday', '12:00 p.m. – 7:00 p.m.', NULL::TEXT, NULL::TEXT)
) AS days(day_of_week, day_label, food_service, bowler_hours, note);