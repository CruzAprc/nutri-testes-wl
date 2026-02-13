-- Create progress_photos table
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'side', 'back')),
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by client
CREATE INDEX IF NOT EXISTS idx_progress_photos_client ON progress_photos(client_id, taken_at DESC);

-- RLS policies for the table
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own progress photos"
  ON progress_photos FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert own progress photos"
  ON progress_photos FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can delete own progress photos"
  ON progress_photos FOR DELETE
  USING (auth.uid() = client_id);

CREATE POLICY "Nutritionists can view client progress photos"
  ON progress_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = progress_photos.client_id
        AND profiles.nutritionist_id = auth.uid()
    )
  );

-- =============================================
-- CREATE STORAGE BUCKET + RLS POLICIES
-- =============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload progress photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Allow anyone to view (public bucket)
CREATE POLICY "Public read progress photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'progress-photos');

-- 4. Allow users to update/overwrite their own photos
CREATE POLICY "Users can update own progress photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Allow users to delete their own photos
CREATE POLICY "Users can delete own progress photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
