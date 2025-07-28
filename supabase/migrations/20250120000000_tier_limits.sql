-- Tier-based Limits Migration
-- Enforces stylist and service limits based on subscription tiers
-- Generated on 2025-01-20

-- Function to enforce stylist limits per salon
-- Free: 1 stylist, Starter: 2 stylists, Pro: 5 stylists, Enterprise: unlimited
CREATE OR REPLACE FUNCTION check_stylist_limit()
RETURNS TRIGGER AS $$
DECLARE
  salon_tier text;
  stylist_count integer;
  max_stylists integer;
  salon_owner_id uuid;
BEGIN
  -- Get the salon owner's tier (assuming the first barber in a salon sets the tier)
  SELECT tier, user_id INTO salon_tier, salon_owner_id
  FROM barber_profiles 
  WHERE salon_id = NEW.salon_id 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- If this is the first barber in the salon, allow the insert
  IF salon_owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count existing stylists in the same salon
  SELECT COUNT(*) INTO stylist_count
  FROM barber_profiles
  WHERE salon_id = NEW.salon_id
  AND deleted_at IS NULL;
  
  -- Set limits based on tier
  max_stylists := CASE
    WHEN salon_tier = 'free' THEN 1
    WHEN salon_tier = 'starter' THEN 2
    WHEN salon_tier = 'pro' THEN 5
    WHEN salon_tier = 'enterprise' THEN NULL -- unlimited
    ELSE 1 -- default to free tier limit
  END;
  
  -- Check if limit would be exceeded
  IF max_stylists IS NOT NULL AND stylist_count >= max_stylists THEN
    RAISE EXCEPTION 'Stylist limit of % reached for % tier. Upgrade your plan to add more stylists.', max_stylists, salon_tier;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce service limits per barber
-- Free: 5 services, Starter: 10 services, Pro/Enterprise: unlimited
CREATE OR REPLACE FUNCTION check_service_limit()
RETURNS TRIGGER AS $$
DECLARE
  barber_tier text;
  service_count integer;
  max_services integer;
BEGIN
  -- Get the barber's tier
  SELECT tier INTO barber_tier 
  FROM barber_profiles 
  WHERE user_id = NEW.barber_id;
  
  -- Count existing services for this barber
  SELECT COUNT(*) INTO service_count
  FROM services
  WHERE barber_id = NEW.barber_id
  AND deleted_at IS NULL;
  
  -- Set limits based on tier
  max_services := CASE
    WHEN barber_tier = 'free' THEN 5
    WHEN barber_tier = 'starter' THEN 10
    WHEN barber_tier = 'pro' THEN NULL -- unlimited
    WHEN barber_tier = 'enterprise' THEN NULL -- unlimited
    ELSE 5 -- default to free tier limit
  END;
  
  -- Check if limit would be exceeded
  IF max_services IS NOT NULL AND service_count >= max_services THEN
    RAISE EXCEPTION 'Service limit of % reached for % tier. Upgrade your plan to add more services.', max_services, barber_tier;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add deleted_at column to barber_profiles for soft deletes
ALTER TABLE barber_profiles 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add deleted_at column to services for soft deletes
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Create triggers
CREATE TRIGGER limit_stylists
BEFORE INSERT ON barber_profiles
FOR EACH ROW
EXECUTE FUNCTION check_stylist_limit();

CREATE TRIGGER limit_services
BEFORE INSERT ON services
FOR EACH ROW
EXECUTE FUNCTION check_service_limit();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_barber_profiles_salon_id_deleted ON barber_profiles(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_barber_deleted ON services(barber_id) WHERE deleted_at IS NULL;

-- Helper function to get tier limits (useful for frontend validation)
CREATE OR REPLACE FUNCTION get_tier_limits(tier_name text)
RETURNS json AS $$
BEGIN
  RETURN CASE tier_name
    WHEN 'free' THEN '{"stylists": 1, "services": 5, "appointments_per_day": 5}'::json
    WHEN 'starter' THEN '{"stylists": 2, "services": 10, "appointments_per_day": 10}'::json
    WHEN 'pro' THEN '{"stylists": 5, "services": null, "appointments_per_day": null}'::json
    WHEN 'enterprise' THEN '{"stylists": null, "services": null, "appointments_per_day": null}'::json
    ELSE '{"stylists": 1, "services": 5, "appointments_per_day": 5}'::json
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to check current usage against limits
CREATE OR REPLACE FUNCTION get_usage_stats(barber_user_id uuid)
RETURNS json AS $$
DECLARE
  barber_tier text;
  salon_id uuid;
  stylist_count integer;
  service_count integer;
  appointment_count integer;
  limits json;
  result json;
BEGIN
  -- Get barber info
  SELECT tier, salon_id INTO barber_tier, salon_id
  FROM barber_profiles 
  WHERE user_id = barber_user_id;
  
  -- Get limits for this tier
  limits := get_tier_limits(barber_tier);
  
  -- Count stylists in salon
  SELECT COUNT(*) INTO stylist_count
  FROM barber_profiles
  WHERE salon_id = salon_id
  AND deleted_at IS NULL;
  
  -- Count services for this barber
  SELECT COUNT(*) INTO service_count
  FROM services
  WHERE barber_id = barber_user_id
  AND deleted_at IS NULL;
  
  -- Count today's appointments
  SELECT COUNT(*) INTO appointment_count
  FROM appointments
  WHERE barber_id = barber_user_id
  AND appointment_date = CURRENT_DATE
  AND status IN ('scheduled', 'confirmed', 'in_progress')
  AND deleted_at IS NULL;
  
  -- Build result
  result := json_build_object(
    'tier', barber_tier,
    'limits', limits,
    'usage', json_build_object(
      'stylists', stylist_count,
      'services', service_count,
      'appointments_today', appointment_count
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 