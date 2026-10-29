CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 254),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','unsubscribed')),
  consent_text text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  consent_source text NOT NULL DEFAULT 'announcements_page',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_source text,
  confirm_token_hash text,
  confirm_expires_at timestamptz,
  confirm_sends_today integer NOT NULL DEFAULT 0,
  last_confirm_sent_at timestamptz,
  welcome_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.newsletter_subscriber_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  event text NOT NULL,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.newsletter_signup_limits (
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT SELECT ON public.newsletter_subscriber_events TO authenticated;
GRANT ALL ON public.newsletter_subscribers, public.newsletter_subscriber_events, public.newsletter_signup_limits TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriber_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_signup_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view subscriber history" ON public.newsletter_subscriber_events FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE INDEX newsletter_subscriber_events_subscriber_idx ON public.newsletter_subscriber_events (subscriber_id, occurred_at DESC);

-- Rate-limit helper: returns false once a bucket exceeds its allowance in the current window.
CREATE FUNCTION public.newsletter_take_limit(p_bucket text, p_window interval, p_max integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w timestamptz := to_timestamp(floor(extract(epoch FROM now()) / extract(epoch FROM p_window)) * extract(epoch FROM p_window)); n integer;
BEGIN
  DELETE FROM newsletter_signup_limits WHERE window_start < now() - interval '2 days';
  INSERT INTO newsletter_signup_limits(bucket, window_start, attempts) VALUES (p_bucket, w, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE SET attempts = newsletter_signup_limits.attempts + 1 RETURNING attempts INTO n;
  RETURN n <= p_max;
END $$;

-- Signup: always creates/refreshes a pending record with fresh consent; never activates. Returns whether a confirmation email may be sent.
CREATE FUNCTION public.newsletter_signup(p_email text, p_consent_text text, p_confirm_hash text, p_client_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(trim(p_email)); s newsletter_subscribers; send boolean := false;
BEGIN
  IF e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(e) > 254 THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;
  IF length(coalesce(p_consent_text,'')) < 20 OR p_confirm_hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;
  IF NOT newsletter_take_limit('client:' || coalesce(p_client_hash,'unknown'), interval '1 hour', 5) THEN RETURN jsonb_build_object('ok', false, 'reason', 'limited'); END IF;
  IF NOT newsletter_take_limit('email:' || md5(e), interval '1 day', 5) THEN RETURN jsonb_build_object('ok', false, 'reason', 'limited'); END IF;
  SELECT * INTO s FROM newsletter_subscribers WHERE email = e FOR UPDATE;
  IF FOUND AND s.status = 'active' THEN RETURN jsonb_build_object('ok', true, 'send', false); END IF;
  IF FOUND AND s.last_confirm_sent_at > now() - interval '10 minutes' THEN RETURN jsonb_build_object('ok', true, 'send', false); END IF;
  IF FOUND AND s.last_confirm_sent_at > now() - interval '1 day' AND s.confirm_sends_today >= 3 THEN RETURN jsonb_build_object('ok', true, 'send', false); END IF;
  IF FOUND THEN
    UPDATE newsletter_subscribers SET status = 'pending', consent_text = p_consent_text, consent_at = now(), unsubscribed_at = NULL, unsubscribe_source = NULL,
      confirm_token_hash = p_confirm_hash, confirm_expires_at = now() + interval '48 hours',
      confirm_sends_today = CASE WHEN last_confirm_sent_at > now() - interval '1 day' THEN confirm_sends_today + 1 ELSE 1 END,
      last_confirm_sent_at = now(), updated_at = now() WHERE id = s.id RETURNING * INTO s;
  ELSE
    INSERT INTO newsletter_subscribers(email, consent_text, confirm_token_hash, confirm_expires_at, confirm_sends_today, last_confirm_sent_at)
    VALUES (e, p_consent_text, p_confirm_hash, now() + interval '48 hours', 1, now()) RETURNING * INTO s;
  END IF;
  INSERT INTO newsletter_subscriber_events(subscriber_id, event) VALUES (s.id, 'signup_consent');
  RETURN jsonb_build_object('ok', true, 'send', true, 'email', s.email);
END $$;

-- Confirmation: single use, expires after 48 hours.
CREATE FUNCTION public.newsletter_confirm(p_confirm_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s newsletter_subscribers;
BEGIN
  IF p_confirm_hash !~ '^[0-9a-f]{64}$' THEN RETURN jsonb_build_object('status', 'invalid'); END IF;
  SELECT * INTO s FROM newsletter_subscribers WHERE confirm_token_hash = p_confirm_hash FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'invalid'); END IF;
  IF s.confirm_expires_at < now() THEN
    UPDATE newsletter_subscribers SET confirm_token_hash = NULL, updated_at = now() WHERE id = s.id;
    RETURN jsonb_build_object('status', 'expired');
  END IF;
  UPDATE newsletter_subscribers SET status = 'active', confirmed_at = now(), confirm_token_hash = NULL, confirm_expires_at = NULL, updated_at = now() WHERE id = s.id;
  INSERT INTO newsletter_subscriber_events(subscriber_id, event) VALUES (s.id, 'confirmed');
  RETURN jsonb_build_object('status', 'confirmed', 'id', s.id, 'email', s.email, 'welcome', s.welcome_sent_at IS NULL);
END $$;

CREATE FUNCTION public.newsletter_mark_welcome(p_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE newsletter_subscribers SET welcome_sent_at = now(), updated_at = now() WHERE id = p_id AND welcome_sent_at IS NULL;
$$;

-- Unsubscribe by verified link (server verifies the signed link before calling).
CREATE FUNCTION public.newsletter_unsubscribe(p_id uuid, p_source text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = now(), unsubscribe_source = p_source, confirm_token_hash = NULL, confirm_expires_at = NULL, updated_at = now()
  WHERE id = p_id AND status <> 'unsubscribed';
  IF FOUND THEN INSERT INTO newsletter_subscriber_events(subscriber_id, event, actor_id) VALUES (p_id, 'unsubscribed_' || p_source, auth.uid()); END IF;
  RETURN true;
END $$;

-- Administrator unsubscribe from the dashboard.
CREATE FUNCTION public.newsletter_admin_unsubscribe(p_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  RETURN newsletter_unsubscribe(p_id, 'admin');
END $$;

-- The only source of marketing recipients: confirmed, not unsubscribed.
CREATE FUNCTION public.newsletter_marketing_recipients() RETURNS TABLE(id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, email FROM newsletter_subscribers WHERE status = 'active' AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.newsletter_take_limit(text, interval, integer), public.newsletter_signup(text, text, text, text), public.newsletter_confirm(text),
  public.newsletter_mark_welcome(uuid), public.newsletter_unsubscribe(uuid, text), public.newsletter_admin_unsubscribe(uuid), public.newsletter_marketing_recipients() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_signup(text, text, text, text), public.newsletter_confirm(text), public.newsletter_mark_welcome(uuid),
  public.newsletter_unsubscribe(uuid, text), public.newsletter_marketing_recipients() TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_admin_unsubscribe(uuid) TO authenticated;

-- Newsletter photos: staff-only uploads; viewable by link only once placed in a saved newsletter draft.
CREATE FUNCTION public.newsletter_image_in_use(p_name text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' AND EXISTS (SELECT 1 FROM newsletter_drafts d WHERE position('/api/public/newsletter-image?path=' || p_name IN d.body) > 0);
$$;
REVOKE ALL ON FUNCTION public.newsletter_image_in_use(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.newsletter_image_in_use(text) TO anon, authenticated, service_role;
CREATE POLICY "Staff upload newsletter images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'newsletter-images' AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff')) AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Staff view newsletter images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'newsletter-images' AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff')));
CREATE POLICY "Newsletter images in saved newsletters" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'newsletter-images' AND public.newsletter_image_in_use(name));