-- Clean up duplicate profiles and add constraints to prevent future duplicates
-- This migration addresses the "JSON object requested, multiple rows returned" error

-- First, let's identify and clean up duplicate profiles
-- Keep only the most recent profile for each user
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
    FROM profiles
  ) t
  WHERE t.rn > 1
);

-- Clean up orphaned barber_profiles (those without corresponding profiles)
DELETE FROM barber_profiles 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Clean up orphaned services (those without corresponding barber_profiles)
DELETE FROM services 
WHERE barber_id NOT IN (SELECT user_id FROM barber_profiles);

-- Clean up orphaned appointments (those without corresponding profiles or barber_profiles)
DELETE FROM appointments 
WHERE customer_id NOT IN (SELECT id FROM profiles)
   OR barber_id NOT IN (SELECT user_id FROM barber_profiles);

-- Clean up orphaned queue entries (those without corresponding barber_profiles)
DELETE FROM queue 
WHERE barber_id NOT IN (SELECT user_id FROM barber_profiles);

-- Clean up orphaned reviews (those without corresponding profiles or barber_profiles)
DELETE FROM reviews 
WHERE customer_id NOT IN (SELECT id FROM profiles)
   OR barber_id NOT IN (SELECT user_id FROM barber_profiles);

-- Clean up orphaned notifications (those without corresponding profiles)
DELETE FROM notifications 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Add unique constraint to prevent future duplicate profiles
-- (This should already exist since id is the primary key, but let's make sure)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_unique UNIQUE (id);

-- Add unique constraint to barber_profiles to prevent duplicates
ALTER TABLE barber_profiles 
ADD CONSTRAINT barber_profiles_user_id_unique UNIQUE (user_id);

-- Add indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_profiles_id_created_at ON profiles(id, created_at);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_user_id_created_at ON barber_profiles(user_id, created_at);

-- Add a comment to document the cleanup
COMMENT ON TABLE profiles IS 
  'User profiles - cleaned up duplicates on 2025-01-21'; 