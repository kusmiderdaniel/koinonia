-- Add notification_preferences JSONB column to profiles table
-- This allows leaders, admins, and owners to customize their notification preferences

ALTER TABLE profiles
ADD COLUMN notification_preferences JSONB DEFAULT '{}';

-- Add GIN index for efficient JSONB querying (future use)
CREATE INDEX idx_profiles_notification_preferences
ON profiles USING GIN (notification_preferences);

-- Add comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS
'JSONB storing granular notification preferences for leaders.
Structure: {
  ministry_invitation_responses: { in_app: bool, email: bool },
  event_invitation_responses: { in_app: bool, email: bool },
  pending_member_registrations: { in_app: bool, email: bool },
  unfilled_positions_reminder: { in_app: bool, email: bool, days_before: number }
}
Empty object {} means use defaults (all notifications enabled).';
