-- Fix RLS policy for services table
-- The current policy incorrectly checks if barber_id is in a subquery
-- It should directly check if barber_id equals the authenticated user's ID

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Barbers can manage own services" ON services;

-- Create the correct policy
CREATE POLICY "Barbers can manage own services" ON services
  FOR ALL TO authenticated
  USING (barber_id = auth.uid());

-- Add a comment to document the fix
COMMENT ON POLICY "Barbers can manage own services" ON services IS 
  'Allows barbers to manage services where barber_id matches their user ID'; 