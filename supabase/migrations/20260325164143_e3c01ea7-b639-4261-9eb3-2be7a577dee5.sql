-- Add attachments column to lab_reports
ALTER TABLE public.lab_reports ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Create storage bucket for lab report files
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to lab-reports bucket
CREATE POLICY "Auth users can upload lab reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lab-reports');

-- Allow authenticated users to view lab report files
CREATE POLICY "Auth users can view lab reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lab-reports');

-- Allow authenticated users to delete lab report files
CREATE POLICY "Auth users can delete lab reports"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lab-reports');