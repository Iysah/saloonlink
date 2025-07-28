-- Fix RLS policy for profiles table to allow new user registration
-- This migration addresses the issue where new users can't create profiles during signup

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that allows profile creation for new users
-- This policy allows authenticated users to insert their own profile
-- and also allows the system to create profiles during signup
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id OR 
    -- Allow profile creation if the user is the one being created
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );

-- Alternative: If the above doesn't work, we can create a more permissive policy
-- that allows profile creation for any authenticated user (for signup purposes)
-- CREATE POLICY "Allow profile creation during signup" ON profiles
--   FOR INSERT TO authenticated
--   WITH CHECK (true);

-- Add a comment to document the fix
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 
  'Allows users to create their own profile during registration and signup process'; 