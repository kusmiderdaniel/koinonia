-- Migration: Update RLS functions and constraints for user_id pattern
-- Purpose: Change from profiles.id = auth.uid() to profiles.user_id = auth.uid()

-- 1. Update get_user_church_id to use user_id instead of id
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT church_id FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 2. Create helper to get profile id from auth user
CREATE OR REPLACE FUNCTION get_user_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 3. Drop the foreign key constraint on profiles.id
-- This allows profiles.id to be any UUID, not tied to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 4. Add constraint: authenticated members must have user_id, offline members must not
-- Note: We can't enforce this with a CHECK constraint yet because existing data might not comply
-- Instead, we'll enforce this at the application level and add the constraint later

-- 5. Update profile RLS policies to use user_id
-- Drop all existing profile policies (both old and new naming conventions)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view church profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from their church" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Policy: Users can view their own profile (by user_id)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can view other profiles in their church
CREATE POLICY "Users can view church profiles"
  ON profiles FOR SELECT
  USING (church_id = get_user_church_id());

-- Policy: Users can update their own profile (by user_id)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can insert profiles (for signup flow, will be restricted at app level)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 6. Update church admin policies to use user_id
DROP POLICY IF EXISTS "Church admins can update own church" ON churches;

CREATE POLICY "Church admins can update own church"
  ON churches FOR UPDATE
  USING (
    id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- 7. Update ministries admin policies to use user_id
DROP POLICY IF EXISTS "Church admins can manage ministries" ON ministries;
DROP POLICY IF EXISTS "Ministry leaders can update own ministries" ON ministries;

CREATE POLICY "Church admins can manage ministries"
  ON ministries FOR ALL
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Ministry leaders can update own ministries"
  ON ministries FOR UPDATE
  USING (
    leader_id = get_user_profile_id()
    OR (
      church_id = get_user_church_id()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
      )
    )
  );
