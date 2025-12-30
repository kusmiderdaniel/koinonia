-- Fix RLS infinite recursion by using a SECURITY DEFINER function
-- This function bypasses RLS when getting the current user's church_id

-- Create a function to get the current user's church_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT church_id FROM profiles WHERE id = auth.uid()
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view profiles from their church" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Recreate profile policies without recursion
-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can view other profiles in their church (uses the function to avoid recursion)
CREATE POLICY "Users can view church profiles"
  ON profiles FOR SELECT
  USING (church_id = get_user_church_id());

-- Fix churches policy too
DROP POLICY IF EXISTS "Users can view their own church" ON churches;

CREATE POLICY "Users can view own church"
  ON churches FOR SELECT
  USING (id = get_user_church_id());

-- Fix ministries policy
DROP POLICY IF EXISTS "Users can view ministries from their church" ON ministries;

CREATE POLICY "Users can view church ministries"
  ON ministries FOR SELECT
  USING (church_id = get_user_church_id());

-- Fix church admin policies to use the function
DROP POLICY IF EXISTS "Church admins can update their church" ON churches;

CREATE POLICY "Church admins can update own church"
  ON churches FOR UPDATE
  USING (
    id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Fix ministries admin policies
DROP POLICY IF EXISTS "Church admins can manage ministries" ON ministries;
DROP POLICY IF EXISTS "Ministry leaders can update their ministries" ON ministries;

CREATE POLICY "Church admins can manage ministries"
  ON ministries FOR ALL
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Ministry leaders can update own ministries"
  ON ministries FOR UPDATE
  USING (
    leader_id = auth.uid()
    OR (
      church_id = get_user_church_id()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
      )
    )
  );
