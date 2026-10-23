ALTER TABLE public.announcements
  ADD COLUMN email_status text NOT NULL DEFAULT 'not_selected',
  ADD COLUMN email_marked_sent_at timestamptz;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_email_status_check
  CHECK (email_status IN ('not_selected','ready','marked_sent'));
COMMENT ON COLUMN public.announcements.email_status IS 'Newsletter prep: not_selected, ready, or marked_sent (staff-confirmed send in GoDaddy; not provider-confirmed).';