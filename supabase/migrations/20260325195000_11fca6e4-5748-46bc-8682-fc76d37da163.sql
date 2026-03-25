ALTER TABLE public.injections ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT 0;
ALTER TABLE public.injections ADD COLUMN IF NOT EXISTS image text DEFAULT '';