
-- Billing records
CREATE TABLE public.billing_records (
  id text PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  paid numeric NOT NULL DEFAULT 0,
  due numeric NOT NULL DEFAULT 0,
  date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT '',
  form_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view billing" ON public.billing_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert billing" ON public.billing_records FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update billing" ON public.billing_records FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete billing" ON public.billing_records FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Injections
CREATE TABLE public.injections (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  strength text NOT NULL DEFAULT '',
  route text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in-stock',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.injections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view injections" ON public.injections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert injections" ON public.injections FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update injections" ON public.injections FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete injections" ON public.injections FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Expenses
CREATE TABLE public.expenses (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'miscellaneous',
  amount numeric NOT NULL DEFAULT 0,
  paid_to text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT 'cash',
  date text NOT NULL DEFAULT '',
  receipt text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update expenses" ON public.expenses FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete expenses" ON public.expenses FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- OPD Patients
CREATE TABLE public.opd_patients (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  age integer NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  time text NOT NULL DEFAULT '',
  complaint text NOT NULL DEFAULT '',
  blood_type text,
  patient_type text,
  phone text,
  medical_history text,
  photo text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.opd_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view patients" ON public.opd_patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert patients" ON public.opd_patients FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update patients" ON public.opd_patients FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete patients" ON public.opd_patients FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Drafts
CREATE TABLE public.drafts (
  id text PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  total numeric NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  saved_at text NOT NULL DEFAULT '',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view drafts" ON public.drafts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert drafts" ON public.drafts FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update drafts" ON public.drafts FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete drafts" ON public.drafts FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Refunds
CREATE TABLE public.refunds (
  id text PRIMARY KEY,
  invoice_id text NOT NULL DEFAULT '',
  patient text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_refund numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  method text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'completed',
  date text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_by text NOT NULL DEFAULT ''
);
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view refunds" ON public.refunds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert refunds" ON public.refunds FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update refunds" ON public.refunds FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete refunds" ON public.refunds FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Audit log
CREATE TABLE public.audit_log (
  id text PRIMARY KEY,
  refund_id text NOT NULL DEFAULT '',
  action text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  timestamp text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view audit" ON public.audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert audit" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);

-- Investors
CREATE TABLE public.investors (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  share_percent numeric NOT NULL DEFAULT 0,
  investment_name text NOT NULL DEFAULT '',
  capital_amount numeric NOT NULL DEFAULT 0,
  paid numeric NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'hsl(217, 91%, 60%)',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view investors" ON public.investors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert investors" ON public.investors FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update investors" ON public.investors FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete investors" ON public.investors FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Contributions
CREATE TABLE public.contributions (
  id text PRIMARY KEY,
  date text NOT NULL DEFAULT '',
  investment_name text NOT NULL DEFAULT '',
  investor_id text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  amount numeric NOT NULL DEFAULT 0,
  slip_count integer NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  slip_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view contributions" ON public.contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update contributions" ON public.contributions FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete contributions" ON public.contributions FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Total capital setting
CREATE TABLE public.investment_settings (
  key text PRIMARY KEY,
  value numeric NOT NULL DEFAULT 0
);
ALTER TABLE public.investment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view inv_settings" ON public.investment_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth upsert inv_settings" ON public.investment_settings FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update inv_settings" ON public.investment_settings FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Lab reports
CREATE TABLE public.lab_reports (
  id text PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  patient_id text NOT NULL DEFAULT '',
  age integer NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT '',
  test_name text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  result_date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  category text NOT NULL DEFAULT 'biochemistry',
  result text NOT NULL DEFAULT '',
  normal_range text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  sample_type text NOT NULL DEFAULT '',
  collected_at text NOT NULL DEFAULT '',
  reported_at text NOT NULL DEFAULT '',
  technician text NOT NULL DEFAULT '',
  pathologist text NOT NULL DEFAULT '',
  instrument text NOT NULL DEFAULT '',
  expected_tat text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view lab_reports" ON public.lab_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert lab_reports" ON public.lab_reports FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update lab_reports" ON public.lab_reports FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete lab_reports" ON public.lab_reports FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Sample collection
CREATE TABLE public.sample_records (
  id text PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  patient_id text NOT NULL DEFAULT '',
  age integer NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT '',
  test_name text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  collection_date text NOT NULL DEFAULT '',
  collection_time text NOT NULL DEFAULT '',
  sample_type text NOT NULL DEFAULT 'blood',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'routine',
  collected_by text NOT NULL DEFAULT '',
  storage_temp text NOT NULL DEFAULT 'room',
  barcode text NOT NULL DEFAULT '',
  rejection_reason text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sample_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view samples" ON public.sample_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert samples" ON public.sample_records FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update samples" ON public.sample_records FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete samples" ON public.sample_records FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Test names
CREATE TABLE public.test_names (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  sample_type text NOT NULL DEFAULT 'other',
  normal_range text NOT NULL DEFAULT '-',
  unit text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 500,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.test_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view test_names" ON public.test_names FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert test_names" ON public.test_names FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update test_names" ON public.test_names FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete test_names" ON public.test_names FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Custom categories and sample types for test names
CREATE TABLE public.test_categories (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.test_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view test_categories" ON public.test_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert test_categories" ON public.test_categories FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete test_categories" ON public.test_categories FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

CREATE TABLE public.test_sample_types (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.test_sample_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view test_sample_types" ON public.test_sample_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert test_sample_types" ON public.test_sample_types FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete test_sample_types" ON public.test_sample_types FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- Ultrasound records
CREATE TABLE public.ultrasound_records (
  id text PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  examination text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  report_date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  region text NOT NULL DEFAULT 'abdomen',
  findings text NOT NULL DEFAULT '',
  impression text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ultrasound_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view ultrasound" ON public.ultrasound_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert ultrasound" ON public.ultrasound_records FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update ultrasound" ON public.ultrasound_records FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete ultrasound" ON public.ultrasound_records FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);

-- X-ray records
CREATE TABLE public.xray_records (
  id text PRIMARY KEY,
  patient text NOT NULL DEFAULT '',
  examination text NOT NULL DEFAULT '',
  doctor text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  report_date text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  body_part text NOT NULL DEFAULT 'chest',
  findings text NOT NULL DEFAULT '',
  impression text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.xray_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view xray" ON public.xray_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert xray" ON public.xray_records FOR INSERT TO authenticated WITH CHECK (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth update xray" ON public.xray_records FOR UPDATE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
CREATE POLICY "Auth delete xray" ON public.xray_records FOR DELETE TO authenticated USING (get_user_role_name(auth.uid()) IS NOT NULL);
