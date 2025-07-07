-- Storage Bucket Setup for Profile Pictures and Service Images
-- This migration creates the necessary storage buckets and policies

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('images', 'images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket (profile pictures)
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Storage policies for images bucket (service images)
CREATE POLICY "Barbers can upload service images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM barber_profiles 
      WHERE user_id = auth.uid() AND 
      (storage.foldername(name))[2] IN (
        SELECT id::text FROM services WHERE barber_id = auth.uid()
      )
    )
  );

CREATE POLICY "Barbers can update their service images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM barber_profiles 
      WHERE user_id = auth.uid() AND 
      (storage.foldername(name))[2] IN (
        SELECT id::text FROM services WHERE barber_id = auth.uid()
      )
    )
  );

CREATE POLICY "Barbers can delete their service images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM barber_profiles 
      WHERE user_id = auth.uid() AND 
      (storage.foldername(name))[2] IN (
        SELECT id::text FROM services WHERE barber_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can view service images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'images');

-- Create service_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on service_images table
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

-- Service images policies
CREATE POLICY "Anyone can read service images"
  ON service_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Barbers can manage their service images"
  ON service_images
  FOR ALL
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM services WHERE barber_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_images_service_id ON service_images(service_id); 