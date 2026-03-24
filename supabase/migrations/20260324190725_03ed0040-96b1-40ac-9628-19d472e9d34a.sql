
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid NOT NULL,
  medicine_name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'deduct',
  qty integer NOT NULL DEFAULT 0,
  stock_before integer NOT NULL DEFAULT 0,
  stock_after integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  reference_id text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth insert stock_movements" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);

CREATE POLICY "Auth delete stock_movements" ON public.stock_movements
  FOR DELETE TO authenticated
  USING (get_user_role_name(auth.uid()) IS NOT NULL);
