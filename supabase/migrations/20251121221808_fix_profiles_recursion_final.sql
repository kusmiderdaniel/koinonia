-- Fix infinite recursion in profiles RLS policies
-- The problem: policies that query the profiles table from within themselves cause infinite recursion

-- Drop the recursive policies
DROP POLICY IF EXISTS "Users can view profiles from their church" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their church" ON profiles;

-- The "Users can view their own profile" policy is sufficient for users to load their profile
-- We'll add church-wide profile viewing later with a helper function if needed

COMMENT ON TABLE profiles IS 'User profiles with church membership. RLS allows users to view their own profile without recursion.';
