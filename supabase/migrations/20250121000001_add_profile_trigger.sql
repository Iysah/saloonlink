-- Add database trigger to automatically create profiles for new users
-- This ensures profiles are always created when users sign up

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if profile already exists to prevent duplicates
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Insert a basic profile for the new user
    -- The user will need to update their details later
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

-- Add a comment to document the trigger
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile and barber profile (if applicable) when a new user signs up'; 