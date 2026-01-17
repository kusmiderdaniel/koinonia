-- Add last_seen_at column to track user activity for online status
ALTER TABLE profiles
ADD COLUMN last_seen_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient querying of online users
CREATE INDEX idx_profiles_last_seen_at ON profiles (last_seen_at DESC NULLS LAST)
WHERE last_seen_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.last_seen_at IS 'Timestamp of last user activity, used to determine online status';
