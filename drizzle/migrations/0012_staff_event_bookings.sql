ALTER TABLE public.booking_requests ADD COLUMN follow_up_status text NOT NULL DEFAULT 'inquiry' CHECK(follow_up_status IN ('inquiry','tentative','confirmed','cancelled'));
ALTER TABLE public.booking_requests ADD COLUMN facility_requirements text NOT NULL DEFAULT '';
ALTER TABLE public.booking_requests ADD COLUMN lane_reservation_id uuid REFERENCES public.lane_reservations(id);
ALTER TABLE public.booking_requests ADD COLUMN duration_minutes integer NOT NULL DEFAULT 120 CHECK(duration_minutes BETWEEN 1 AND 1440);
UPDATE public.booking_requests SET follow_up_status=CASE WHEN status::text IN ('confirmed','completed') THEN 'confirmed' WHEN status::text='declined' THEN 'cancelled' ELSE 'inquiry' END;
CREATE FUNCTION public.reservation_inquiry_save(p jsonb,p_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE b booking_requests; linked uuid; saved jsonb; st text:=coalesce(p->>'follow_up_status','inquiry'); n integer:=coalesce((p->>'lanes')::integer,0); guests integer:=(p->>'party_size')::integer; alloc integer[]; dur integer:=(p->>'duration_minutes')::integer;
BEGIN
IF NOT coalesce(private.is_staff(auth.uid()),false) THEN RAISE EXCEPTION 'Staff access required.'; END IF;
PERFORM pg_advisory_xact_lock(6281962);
IF p_id IS NOT NULL THEN SELECT * INTO b FROM booking_requests WHERE id=p_id; IF NOT FOUND THEN RAISE EXCEPTION 'Inquiry not found.'; END IF; linked:=b.lane_reservation_id; END IF;
IF st NOT IN ('inquiry','tentative','confirmed','cancelled') OR n NOT BETWEEN 0 AND 6 OR guests IS NULL OR guests NOT BETWEEN 1 AND 1000 OR dur IS NULL OR dur NOT BETWEEN 1 AND 1440 THEN RAISE EXCEPTION 'Check status, guests, lanes and duration.'; END IF;
IF length(trim(coalesce(p->>'booking_type',''))) NOT BETWEEN 1 AND 100 OR length(trim(coalesce(p->>'contact_name',''))) NOT BETWEEN 2 AND 120 OR length(trim(coalesce(p->>'phone',''))) NOT BETWEEN 7 AND 40 OR length(coalesce(p->>'email',''))>254 OR (coalesce(p->>'email','')<>'' AND p->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') OR length(coalesce(p->>'notes',''))>3000 OR length(coalesce(p->>'facility_requirements',''))>1000 THEN RAISE EXCEPTION 'Enter a customer name and telephone number; check the optional email and notes.'; END IF;
IF nullif(p->>'requested_date','') IS NULL THEN RAISE EXCEPTION 'Choose an event date.'; END IF;
IF st='confirmed' AND n>0 THEN
IF nullif(p->>'requested_time','') IS NULL THEN RAISE EXCEPTION 'Choose a start time before confirming lanes.'; END IF;
alloc:=ARRAY(SELECT greatest(1,least(6,guests/n+CASE WHEN i<=guests%n THEN 1 ELSE 0 END)) FROM generate_series(1,n) i);
saved:=reservation_save(jsonb_build_object('request_key',coalesce((SELECT request_key FROM lane_reservations WHERE id=linked),gen_random_uuid()),'contact_name',p->>'contact_name','phone',p->>'phone','email',coalesce(p->>'email',''),'day',p->>'requested_date','time',p->>'requested_time','allocations',to_jsonb(alloc),'games',(SELECT (config->'games'->>0)::integer FROM reservation_settings WHERE id=1),'duration_minutes',dur,'status','confirmed','notes',coalesce(p->>'notes','')),linked); linked:=(saved->>'id')::uuid;
ELSIF linked IS NOT NULL THEN
SELECT reservation_save(to_jsonb(r)||jsonb_build_object('day',r.starts_at::date,'time',r.starts_at::time,'status','cancelled'),r.id) INTO saved FROM lane_reservations r WHERE id=linked;
END IF;
IF p_id IS NULL THEN
INSERT INTO booking_requests(booking_type,contact_name,phone,email,requested_date,requested_time,party_size,lanes,notes,status,created_by,follow_up_status,facility_requirements,lane_reservation_id,duration_minutes) VALUES(p->>'booking_type',trim(p->>'contact_name'),trim(p->>'phone'),trim(coalesce(p->>'email','')),(p->>'requested_date')::date,coalesce(nullif(p->>'requested_time','')::time,'00:00'),guests,n,coalesce(p->>'notes',''),CASE WHEN st='confirmed' THEN 'confirmed'::booking_status WHEN st='cancelled' THEN 'declined'::booking_status ELSE 'new'::booking_status END,auth.uid(),st,coalesce(p->>'facility_requirements',''),linked,dur) RETURNING id INTO p_id;
ELSE UPDATE booking_requests SET booking_type=p->>'booking_type',contact_name=trim(p->>'contact_name'),phone=trim(p->>'phone'),email=trim(coalesce(p->>'email','')),requested_date=(p->>'requested_date')::date,requested_time=coalesce(nullif(p->>'requested_time','')::time,'00:00'),party_size=guests,lanes=n,notes=coalesce(p->>'notes',''),follow_up_status=st,facility_requirements=coalesce(p->>'facility_requirements',''),lane_reservation_id=linked,duration_minutes=dur,status=CASE WHEN st='confirmed' THEN 'confirmed'::booking_status WHEN st='cancelled' THEN 'declined'::booking_status ELSE 'new'::booking_status END,updated_at=now() WHERE id=p_id;
END IF;
RETURN jsonb_build_object('saved',true,'id',p_id);
END $$;
REVOKE ALL ON FUNCTION public.reservation_inquiry_save(jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reservation_inquiry_save(jsonb,uuid) TO authenticated;
DO $$ DECLARE d text; BEGIN SELECT pg_get_functiondef('public.reservation_staff(text,jsonb)'::regprocedure) INTO d; d:=replace(d,$a$'settings',(SELECT config$a$,$a$'inquiries',coalesce((SELECT jsonb_agg(event_row ORDER BY requested_date) FROM booking_requests event_row),'[]'::jsonb),'settings',(SELECT config$a$); EXECUTE d; END $$;