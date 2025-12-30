-- Migration: Add user_id and member_type to profiles
-- Purpose: Separate church members from authenticated users
-- This allows "offline" members (e.g., children) who don't have accounts

-- 1. Add user_id column (nullable - will be null for offline members)
ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Populate user_id with existing id values for all current profiles
-- This maintains backward compatibility - all existing profiles are authenticated users
UPDATE profiles SET user_id = id;

-- 3. Add member_type column to distinguish authenticated vs offline members
ALTER TABLE profiles ADD COLUMN member_type TEXT NOT NULL DEFAULT 'authenticated'
  CHECK (member_type IN ('authenticated', 'offline'));

-- 4. Make email optional (offline members may not have email)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 5. Create index on user_id for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- 6. Ensure only one authenticated profile per user per church
CREATE UNIQUE INDEX idx_profiles_user_church ON profiles(user_id, church_id) WHERE user_id IS NOT NULL;
