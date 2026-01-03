-- Add email_token column to notifications table for one-click email actions
-- Only position_invitation notifications with assignment_id will have tokens

ALTER TABLE notifications
  ADD COLUMN email_token TEXT UNIQUE;

-- Create partial index for fast token lookup (only on non-null values)
CREATE INDEX idx_notifications_email_token
  ON notifications(email_token)
  WHERE email_token IS NOT NULL;

COMMENT ON COLUMN notifications.email_token IS 'Unique token for one-click email actions. Only set for position_invitation type.';
