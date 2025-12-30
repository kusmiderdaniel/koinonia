-- Add date_of_birth and sex columns to profiles table
ALTER TABLE profiles
ADD COLUMN date_of_birth DATE,
ADD COLUMN sex TEXT CHECK (sex IN ('male', 'female'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN profiles.sex IS 'User sex: male or female';
