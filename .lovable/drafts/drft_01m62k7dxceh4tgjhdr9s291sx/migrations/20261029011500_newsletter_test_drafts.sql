CREATE TABLE public.newsletter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_test_status text,
  last_test_at timestamptz,
  last_test_recipient text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_drafts TO authenticated;
GRANT ALL ON public.newsletter_drafts TO service_role;
ALTER TABLE public.newsletter_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage newsletter test drafts" ON public.newsletter_drafts
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff'));

CREATE FUNCTION public.newsletter_staff_access() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$ SELECT coalesce(private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff'), false) $$;
REVOKE ALL ON FUNCTION public.newsletter_staff_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.newsletter_staff_access() TO authenticated, service_role;

CREATE FUNCTION public.newsletter_validate_draft() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF length(trim(NEW.subject)) = 0 OR length(NEW.subject) > 200 THEN
    RAISE EXCEPTION 'Enter a subject of 1 to 200 characters.';
  END IF;
  IF length(trim(NEW.body)) = 0 OR length(NEW.body) > 20000 THEN
    RAISE EXCEPTION 'Enter newsletter content of 1 to 20000 characters.';
  END IF;
  IF NEW.last_test_recipient IS NOT NULL AND NEW.last_test_recipient <> 'jonah.beattie78@gmail.com' THEN
    RAISE EXCEPTION 'Test recipient is not allowed.';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER newsletter_validate_draft BEFORE INSERT OR UPDATE ON public.newsletter_drafts
FOR EACH ROW EXECUTE FUNCTION public.newsletter_validate_draft();