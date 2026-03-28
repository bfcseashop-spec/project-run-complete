
CREATE TABLE public.prescriptions (
  id text NOT NULL PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  patient_id text NOT NULL DEFAULT '',
  age text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  doctor_specialization text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  medicines text NOT NULL DEFAULT '',
  medicine_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  injections jsonb NOT NULL DEFAULT '[]'::jsonb,
  tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  chief_complaint text NOT NULL DEFAULT '',
  on_examination text NOT NULL DEFAULT '',
  advices text NOT NULL DEFAULT '',
  follow_up text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete prescriptions" ON public.prescriptions FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
