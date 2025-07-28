-- Salon Booking System Database Schema
-- Supports Basic (Free/Starter), Pro, and Enterprise tiers
-- Generated on 2025-07-15

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table: Stores user information (customers and barbers)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'barber')),
  phone text,
  profile_picture text,
  date_of_birth date, -- Added for demographics (Enterprise tier)
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')), -- Added for demographics
  created_at timestamptz DEFAULT now()
);

-- Barber Profiles table: Stores barber-specific details
CREATE TABLE IF NOT EXISTS barber_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  salon_name text,
  location text,
  is_available boolean DEFAULT true,
  working_hours jsonb DEFAULT '{"monday": {"start": "09:00", "end": "18:00", "enabled": true}, "tuesday": {"start": "09:00", "end": "18:00", "enabled": true}, "wednesday": {"start": "09:00", "end": "18:00", "enabled": true}, "thursday": {"start": "09:00", "end": "18:00", "enabled": true}, "friday": {"start": "09:00", "end": "18:00", "enabled": true}, "saturday": {"start": "09:00", "end": "16:00", "enabled": true}, "sunday": {"start": "10:00", "end": "14:00", "enabled": false}}'::jsonb,
  walk_in_enabled boolean DEFAULT true,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')), -- Added for tier limits
  salon_id uuid DEFAULT gen_random_uuid(), -- Added for grouping barbers by salon
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_salon_name UNIQUE (salon_name)
);

-- Services table: Stores hairstyle/service offerings
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  service_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  service_image text, -- Added for custom hairstyle uploads (Enterprise tier)
  is_predefined boolean DEFAULT false, -- Added to distinguish predefined vs custom services
  created_at timestamptz DEFAULT now()
);

-- Appointments table: Stores booked appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  deleted_at timestamptz, -- Added for soft deletes (analytics/audit)
  created_at timestamptz DEFAULT now()
);

-- Queue table: Stores walk-in queue entries
CREATE TABLE IF NOT EXISTS queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  position integer NOT NULL,
  join_time timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  estimated_wait_minutes integer DEFAULT 0,
  priority integer DEFAULT 0, -- Added for priority queue (Pro tier)
  actual_wait_minutes integer, -- Added for AI optimization (Enterprise tier)
  deleted_at timestamptz, -- Added for soft deletes
  created_at timestamptz DEFAULT now()
);

-- Notifications table: Stores in-app messages and push notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking_confirmation', 'queue_confirmation', 'queue_alert', 'appointment_reminder', 'promotion', 'message')),
  message text NOT NULL,
  phone text,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Reviews table: Stores customer reviews and ratings
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, appointment_id)
);

-- Analytics table: Stores precomputed analytics for Pro/Enterprise tiers
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id= auth.uid()
  );

-- Campaigns table: Stores marketing campaigns for Enterprise tier
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  message text NOT NULL,
  target_audience jsonb, -- e.g., {"customer_ids": [], "criteria": {"age": ">18"}}
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row-Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Barber Profiles RLS policies
CREATE POLICY "Anyone can read barber profiles" ON barber_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Barbers can manage own profile" ON barber_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Services RLS policies
CREATE POLICY "Anyone can read services" ON services
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Barbers can manage own services" ON services
  FOR ALL TO authenticated
  USING (
    barber_id IN (
      SELECT user_id FROM barber_profiles WHERE user_id = auth.uid()
    )
  );

-- Appointments RLS policies
CREATE POLICY "Users can read own appointments" ON appointments
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() OR 
    barber_id = auth.uid()
  );

CREATE POLICY "Customers can create appointments" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Barbers and customers can update appointments" ON appointments
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid() OR 
    barber_id = auth.uid()
  );

-- Queue RLS policies
CREATE POLICY "Anyone can read queue" ON queue
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anyone can join queue" ON queue
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Barbers can manage own queue" ON queue
  FOR UPDATE TO authenticated
  USING (
    barber_id IN (
      SELECT user_id FROM barber_profiles WHERE user_id = auth.uid()
    )
  );

-- Notifications RLS policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only system can update notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (false); -- Adjust for system user if needed

-- Reviews RLS policies
CREATE POLICY "Customers can read all reviews" ON reviews
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews for their own appointments" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE customer_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Customers can update their own reviews" ON reviews
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can delete their own reviews" ON reviews
  FOR DELETE TO authenticated
  USING (customer_id = auth.uid());

-- Analytics RLS policies
CREATE POLICY "Barbers can read own analytics" ON analytics
  FOR SELECT TO authenticated
  USING (barber_id = auth.uid());

-- Campaigns RLS policies
CREATE POLICY "Barbers can manage own campaigns" ON campaigns
  FOR ALL TO authenticated
  USING (barber_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_queue_barber_position ON queue(barber_id, position);
CREATE INDEX IF NOT EXISTS idx_queue_barber_join_time ON queue(barber_id, join_time);
CREATE INDEX IF NOT EXISTS idx_services_barber ON services(barber_id);
CREATE INDEX IF NOT EXISTS idx_barber_profiles_salon_id ON barber_profiles(salon_id);

-- Trigger to enforce appointment limits (5 for Free, 10 for Starter)
CREATE OR REPLACE FUNCTION check_appointment_limit()
RETURNS TRIGGER AS $$
DECLARE
  barber_tier text;
  appointment_count integer;
  max_appointments integer;
BEGIN
  SELECT tier INTO barber_tier FROM barber_profiles WHERE user_id = NEW.barber_id;
  SELECT COUNT(*) INTO appointment_count
  FROM appointments
  WHERE barber_id = NEW.barber_id
  AND appointment_date = NEW.appointment_date
  AND status IN ('scheduled', 'confirmed', 'in_progress')
  AND deleted_at IS NULL;
  
  max_appointments := CASE
    WHEN barber_tier = 'free' THEN 5
    WHEN barber_tier = 'starter' THEN 10
    ELSE NULL
  END;
  
  IF max_appointments IS NOT NULL AND appointment_count >= max_appointments THEN
    RAISE EXCEPTION 'Appointment limit of % reached for % tier', max_appointments, barber_tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_appointments
BEFORE INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION check_appointment_limit();