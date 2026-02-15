-- Storage bucket and policies for widget image uploads
-- Run this in Supabase SQL Editor if image upload fails ("Bucket not found" or RLS errors).

-- Create the widgets bucket (public so image URLs work in the feed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('widgets', 'widgets', true)
ON CONFLICT (id) DO NOTHING;

-- Optional: avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for widgets bucket: anyone can view, only authenticated users can upload to their own folder (path: user_id/...)
DROP POLICY IF EXISTS "Widget images are publicly accessible" ON storage.objects;
CREATE POLICY "Widget images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'widgets');

-- Allow any authenticated user to upload to widgets (path is still user_id/... in app code)
DROP POLICY IF EXISTS "Users can upload widget images" ON storage.objects;
CREATE POLICY "Users can upload widget images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'widgets');

-- Allow users to update/delete their own widget images
DROP POLICY IF EXISTS "Users can update own widget images" ON storage.objects;
CREATE POLICY "Users can update own widget images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own widget images" ON storage.objects;
CREATE POLICY "Users can delete own widget images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ((storage.foldername(name))[1] = auth.uid()::text);
