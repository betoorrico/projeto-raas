-- Allow public access to upload files (INSERT) to 'uploads' bucket
CREATE POLICY "Public Access INSERT"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploads' );

-- Ensure public access to view files (SELECT)
CREATE POLICY "Public Access SELECT"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );
