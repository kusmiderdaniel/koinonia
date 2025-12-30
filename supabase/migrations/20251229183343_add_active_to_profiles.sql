-- ============================================
-- Add Active Status to Profiles
-- ============================================
-- Adds an 'active' boolean column to profiles
-- Only active users can be assigned to ministries and event roles
-- Default is true for new users
-- ============================================

ALTER TABLE profiles
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Add index for querying active users
CREATE INDEX idx_profiles_active ON profiles(church_id, active);
