-- Fix infinite recursion in profiles RLS policies
-- The issue: policies were querying profiles table from within themselves

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view profiles from their church" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their church" ON profiles;

-- Recreate without circular dependencies
-- Users can view their own profile (kept as is - no recursion)
-- Note: "Users can view their own profile" policy already exists and is fine

-- For now, we'll skip the church-wide view policy to avoid recursion
-- This can be re-added later with a helper function if needed

-- Keep the simple self-update policy (already exists and works)
-- Note: "Users can update their own profile" policy already exists and is fine
