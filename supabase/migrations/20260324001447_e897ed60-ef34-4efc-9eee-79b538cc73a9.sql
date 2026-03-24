
CREATE TABLE public.doctors (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT 'General Medicine',
  qualification text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  experience integer NOT NULL DEFAULT 0,
  consultation_fee numeric NOT NULL DEFAULT 0,
  bio text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  patients integer NOT NULL DEFAULT 0,
  photo text NOT NULL DEFAULT '',
  join_date text NOT NULL DEFAULT '',
  schedule jsonb NOT NULL DEFAULT '{"workingDays":["Saturday","Sunday","Monday","Tuesday","Wednesday"],"shiftStart":"09:00","shiftEnd":"17:00","leaveType":"","leaveNote":""}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update doctors" ON public.doctors FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete doctors" ON public.doctors FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
