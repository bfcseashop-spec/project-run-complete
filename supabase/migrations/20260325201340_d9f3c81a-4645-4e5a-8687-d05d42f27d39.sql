
CREATE TABLE public.lab_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view lab_technicians" ON public.lab_technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert lab_technicians" ON public.lab_technicians FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update lab_technicians" ON public.lab_technicians FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete lab_technicians" ON public.lab_technicians FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Seed default technicians
INSERT INTO public.lab_technicians (name) VALUES ('Tech. Ravi'), ('Tech. Priya'), ('Tech. Anand'), ('Tech. Meera');
