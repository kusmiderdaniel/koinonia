-- Create church-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-logos',
  'church-logos',
  true,  -- Public bucket so logos can be displayed without auth
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for church-logos bucket

-- Anyone can view logos (public bucket)
CREATE POLICY "Church logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'church-logos');

-- Only authenticated admins can upload logos for their church
CREATE POLICY "Admins can upload church logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'church-logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND church_id::text = (storage.foldername(name))[1]
    )
  );

-- Only authenticated admins can update logos for their church
CREATE POLICY "Admins can update church logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'church-logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND church_id::text = (storage.foldername(name))[1]
    )
  );

-- Only authenticated admins can delete logos for their church
CREATE POLICY "Admins can delete church logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'church-logos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      AND church_id::text = (storage.foldername(name))[1]
    )
  );
