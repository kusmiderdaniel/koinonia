-- Add invitation_response notification type for notifying ministry leaders
-- when volunteers accept or decline invitations

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'position_invitation',
    'assignment_reminder',
    'event_update',
    'general',
    'task_assignment',
    'task_due_reminder',
    'task_comment',
    'invitation_response'  -- New: when volunteer accepts/declines invitation
  ));

COMMENT ON COLUMN notifications.type IS 'Type of notification. invitation_response is sent to ministry leaders when volunteers respond to position invitations.';
