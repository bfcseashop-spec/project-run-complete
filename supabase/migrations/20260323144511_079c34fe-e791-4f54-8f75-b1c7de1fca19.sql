
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view app_settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth update app_settings" ON public.app_settings FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth insert app_settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);

INSERT INTO public.app_settings (key, value) VALUES ('global', '{}'::jsonb);
