
CREATE TABLE public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text NOT NULL,
  patient text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'Cash',
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  note text NOT NULL DEFAULT ''
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view payment_history" ON public.payment_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert payment_history" ON public.payment_history FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete payment_history" ON public.payment_history FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
