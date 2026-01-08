-- Create storage bucket for link tree images
INSERT INTO storage.buckets (id, name, public)
VALUES ('link-images', 'link-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their church's folder
CREATE POLICY "Users can upload link images for their church"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'link-images'
  AND (storage.foldername(name))[1] = (
    SELECT church_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

-- Allow anyone to view link images (public bucket)
CREATE POLICY "Anyone can view link images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'link-images');

-- Allow authenticated users to delete their church's images
CREATE POLICY "Users can delete link images for their church"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'link-images'
  AND (storage.foldername(name))[1] = (
    SELECT church_id::text FROM profiles WHERE user_id = auth.uid()
  )
);
