
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS batch_no text NOT NULL DEFAULT '-';
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS stock_alert integer NOT NULL DEFAULT 10;
