INSERT INTO storage.buckets (id, name, public) VALUES ('injection-images', 'injection-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload injection images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'injection-images');

CREATE POLICY "Authenticated users can update injection images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'injection-images');

CREATE POLICY "Authenticated users can delete injection images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'injection-images');

CREATE POLICY "Anyone can view injection images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'injection-images');