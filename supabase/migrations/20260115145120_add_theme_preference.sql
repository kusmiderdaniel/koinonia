-- Add theme_preference column to profiles table
-- This allows each user to save their preferred theme (light, dark, or system)

ALTER TABLE profiles
ADD COLUMN theme_preference text DEFAULT 'system';

-- Add a check constraint to ensure valid values
ALTER TABLE profiles
ADD CONSTRAINT profiles_theme_preference_check
CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add a comment explaining the column
COMMENT ON COLUMN profiles.theme_preference IS 'User preferred theme: light, dark, or system (follows OS setting)';
