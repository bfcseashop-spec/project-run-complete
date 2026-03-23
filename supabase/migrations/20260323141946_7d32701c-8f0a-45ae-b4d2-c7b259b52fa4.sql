
DROP POLICY "Authenticated users can insert medicines" ON public.medicines;
DROP POLICY "Authenticated users can update medicines" ON public.medicines;
DROP POLICY "Authenticated users can delete medicines" ON public.medicines;

CREATE POLICY "Auth users can insert medicines"
  ON public.medicines FOR INSERT TO authenticated
  WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);

CREATE POLICY "Auth users can update medicines"
  ON public.medicines FOR UPDATE TO authenticated
  USING (get_user_role_name(auth.uid()) IS NOT NULL);

CREATE POLICY "Auth users can delete medicines"
  ON public.medicines FOR DELETE TO authenticated
  USING (get_user_role_name(auth.uid()) IS NOT NULL);
