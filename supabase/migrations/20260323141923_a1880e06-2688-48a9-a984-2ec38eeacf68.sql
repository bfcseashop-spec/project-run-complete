
CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  manufacturer text NOT NULL DEFAULT '',
  box_no text NOT NULL DEFAULT '-',
  category text NOT NULL DEFAULT 'Tablet',
  purchase_price numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'Tabs',
  sold_out integer NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT '',
  expiry text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'in-stock',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view medicines"
  ON public.medicines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert medicines"
  ON public.medicines FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update medicines"
  ON public.medicines FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete medicines"
  ON public.medicines FOR DELETE TO authenticated USING (true);

-- Seed initial data
INSERT INTO public.medicines (name, manufacturer, box_no, category, purchase_price, price, stock, unit, sold_out, image, expiry, status) VALUES
('Amoxicillin 500mg', 'BBCA Pharma', '-', 'Antibiotic', 0.05, 0.25, 240, 'Caps', 12, '', '2028-09-26', 'in-stock'),
('Paracetamol 650mg', 'Square', '-', 'Analgesic', 0.02, 0.15, 500, 'Tabs', 35, '', '2028-03-30', 'in-stock'),
('Metformin 500mg', 'Novo Nordisk', '-', 'Antidiabetic', 0.04, 0.30, 18, 'Tabs', 5, '', '2027-08-07', 'low-stock'),
('Omeprazole 20mg', 'Sanofi', '-', 'Antacid', 0.06, 0.35, 0, 'Caps', 0, '', '2026-06-01', 'out-of-stock'),
('Cetirizine 10mg', 'Square', '-', 'Antihistamine', 0.03, 0.25, 150, 'Tabs', 10, '', '2028-01-30', 'in-stock'),
('Azithromycin 250mg', 'BBCA Pharma', '-', 'Antibiotic', 0.10, 0.50, 45, 'Tabs', 8, '', '2027-11-22', 'in-stock'),
('Ibuprofen 400mg', 'PT MediFarma Lab', '-', 'Analgesic', 0.04, 0.20, 300, 'Tabs', 20, '', '2028-05-15', 'in-stock'),
('Ciprofloxacin 500mg', 'Korean Drug co.Ltd', '-', 'Antibiotic', 0.08, 0.40, 80, 'Tabs', 15, '', '2028-02-28', 'in-stock'),
('Alatrol', 'Square', '-', 'Syrup', 0.80, 4.99, 97, 'Bottles', 0, '', '2028-08-30', 'in-stock'),
('Actrapid', 'Novo Nordisk', '-', 'Injection', 8.50, 50.00, 1, 'Vials', 0, '', '2026-08-31', 'low-stock');
