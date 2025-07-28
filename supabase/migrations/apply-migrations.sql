-- Apply all migration fixes to resolve RLS and duplicate profile issues
-- Run this in your Supabase SQL editor

-- 1. Fix RLS policy for profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id OR 
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );

-- 2. Clean up duplicate profiles
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
    FROM profiles
  ) t
  WHERE t.rn > 1
);

-- 3. Clean up orphaned records
DELETE FROM barber_profiles 
WHERE user_id NOT IN (SELECT id FROM profiles);

DELETE FROM services 
WHERE barber_id NOT IN (SELECT user_id FROM barber_profiles);

DELETE FROM appointments 
WHERE customer_id NOT IN (SELECT id FROM profiles)
   OR barber_id NOT IN (SELECT user_id FROM barber_profiles);

DELETE FROM queue 
WHERE barber_id NOT IN (SELECT user_id FROM barber_profiles);

DELETE FROM reviews 
WHERE customer_id NOT IN (SELECT id FROM profiles)
   OR barber_id NOT IN (SELECT user_id FROM barber_profiles);

DELETE FROM notifications 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- 4. Add constraints to prevent future duplicates
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_unique UNIQUE (id);

ALTER TABLE barber_profiles 
ADD CONSTRAINT barber_profiles_user_id_unique UNIQUE (user_id);

-- 5. Create database trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists to prevent duplicates
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Insert a basic profile for the new user
    INSERT INTO public.profiles (id, name, role, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
    );
  END IF;
  
  -- If the user is a barber, create barber profile (if it doesn't exist)
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'barber' 
     AND NOT EXISTS (SELECT 1 FROM public.barber_profiles WHERE user_id = NEW.id) THEN
    INSERT INTO public.barber_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id_created_at ON profiles(id, created_at);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_user_id_created_at ON barber_profiles(user_id, created_at);

-- Add comments
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 
  'Allows users to create their own profile during registration and signup process';

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile and barber profile (if applicable) when a new user signs up';

COMMENT ON TABLE profiles IS 
  'User profiles - cleaned up duplicates and fixed RLS policies on 2025-01-21';

-- 7. Fix services RLS policy
DROP POLICY IF EXISTS "Barbers can manage own services" ON services;

CREATE POLICY "Barbers can manage own services" ON services
  FOR ALL TO authenticated
  USING (barber_id = auth.uid());

COMMENT ON POLICY "Barbers can manage own services" ON services IS 
  'Allows barbers to manage services where barber_id matches their user ID';

-- 8. Fix queue RLS policy (same issue as services)
DROP POLICY IF EXISTS "Barbers can manage own queue" ON queue;

CREATE POLICY "Barbers can manage own queue" ON queue
  FOR UPDATE TO authenticated
  USING (barber_id = auth.uid());

COMMENT ON POLICY "Barbers can manage own queue" ON queue IS 
  'Allows barbers to manage queue entries where barber_id matches their user ID'; 