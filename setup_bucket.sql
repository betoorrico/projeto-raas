-- 1. Create the 'uploads' bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view files (SELECT)
CREATE POLICY "Public Access SELECT"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- 3. Allow public access to upload files (INSERT)
CREATE POLICY "Public Access INSERT"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploads' );

-- 4. Allow public access to update files (UPDATE) - Optional
CREATE POLICY "Public Access UPDATE"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'uploads' );
