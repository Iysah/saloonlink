/*
  # Initial Schema for Salon Booking System

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `role` (text, either 'customer' or 'barber')
      - `phone` (text)
      - `profile_picture` (text, URL)
      - `created_at` (timestamp)
    - `barber_profiles`
      - `user_id` (uuid, references profiles)
      - `bio` (text)
      - `salon_name` (text)
      - `location` (text)
      - `is_available` (boolean)
      - `working_hours` (jsonb)
      - `walk_in_enabled` (boolean)
    - `services`
      - `id` (uuid, primary key)
      - `barber_id` (uuid, references barber_profiles)
      - `service_name` (text)
      - `price` (numeric)
      - `duration_minutes` (integer)
    - `appointments`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references profiles)
      - `barber_id` (uuid, references barber_profiles)
      - `service_id` (uuid, references services)
      - `appointment_date` (date)
      - `appointment_time` (time)
      - `status` (text)
      - `notes` (text)
    - `queue`
      - `id` (uuid, primary key)
      - `barber_id` (uuid, references barber_profiles)
      - `customer_name` (text)
      - `phone` (text)
      - `position` (integer)
      - `join_time` (timestamp)
      - `status` (text)
      - `estimated_wait_minutes` (integer)
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `type` (text)
      - `message` (text)
      - `sent_at` (timestamp)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for barbers to manage their services and appointments
    - Add policies for customers to view barber profiles and book appointments
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'barber')),
  phone text,
  profile_picture text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS barber_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  salon_name text,
  location text,
  is_available boolean DEFAULT true,
  working_hours jsonb DEFAULT '{"monday": {"start": "09:00", "end": "18:00", "enabled": true}, "tuesday": {"start": "09:00", "end": "18:00", "enabled": true}, "wednesday": {"start": "09:00", "end": "18:00", "enabled": true}, "thursday": {"start": "09:00", "end": "18:00", "enabled": true}, "friday": {"start": "09:00", "end": "18:00", "enabled": true}, "saturday": {"start": "09:00", "end": "16:00", "enabled": true}, "sunday": {"start": "10:00", "end": "14:00", "enabled": false}}'::jsonb,
  walk_in_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  service_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barber_profiles(user_id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  position integer NOT NULL,
  join_time timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  estimated_wait_minutes integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking_confirmation', 'queue_confirmation', 'queue_alert', 'appointment_reminder')),
  message text NOT NULL,
  phone text,
  sent_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Barber profiles policies
CREATE POLICY "Anyone can read barber profiles"
  ON barber_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Barbers can manage own profile"
  ON barber_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Services policies
CREATE POLICY "Anyone can read services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Barbers can manage own services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    barber_id IN (
      SELECT user_id FROM barber_profiles WHERE user_id = auth.uid()
    )
  );

-- Appointments policies
CREATE POLICY "Users can read own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR 
    barber_id = auth.uid()
  );

CREATE POLICY "Customers can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Barbers and customers can update appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid() OR 
    barber_id = auth.uid()
  );

-- Queue policies
CREATE POLICY "Anyone can read queue"
  ON queue
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can join queue"
  ON queue
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Barbers can manage own queue"
  ON queue
  FOR UPDATE
  TO authenticated
  USING (
    barber_id IN (
      SELECT user_id FROM barber_profiles WHERE user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Reviews and Ratings Tables
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

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Customers can read all reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews for their own appointments"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    appointment_id IN (
      SELECT id FROM appointments 
      WHERE customer_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Customers can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can delete their own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_queue_barber_position ON queue(barber_id, position);
CREATE INDEX IF NOT EXISTS idx_services_barber ON services(barber_id);


Request ID: 1be5af64-cdab-415d-86a5-214e77a9d5ea
{"error":"ERROR_USER_ABORTED_REQUEST","details":{"title":"User aborted request.","detail":"Tool call ended before result was received","isRetryable":false,"additionalInfo":{},"buttons":[]},"isExpected":true}
ConnectError: [aborted] Error
    at x9a.$endAiConnectTransportReportError (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:4757:223764)
    at hir.S (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:492:17741)
    at hir.Q (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:492:17519)
    at hir.M (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:492:16607)
    at hir.L (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:492:15708)
    at Bwt.value (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:492:14500)
    at ve.B (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:48:2398)
    at ve.fire (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:48:2617)
    at Git.fire (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:4744:10379)
    at u.onmessage (vscode-file://vscode-app/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js:6968:12271)