ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS image_path text;

CREATE POLICY "community photos readable"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'community-photos');

CREATE POLICY "community photos own insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "community photos own update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "community photos own delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);