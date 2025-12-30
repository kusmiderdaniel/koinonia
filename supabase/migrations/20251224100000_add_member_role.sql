-- Add 'member' role to the profiles table role constraint
-- Role hierarchy: owner > admin > leader > volunteer > member

-- Drop the existing constraint and add a new one with 'member' included
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner', 'admin', 'leader', 'volunteer', 'member'));

-- Update the default role for new signups to 'member' (optional - keeping as volunteer for now)
-- If you want new signups to be members by default, uncomment below:
-- ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'member';
