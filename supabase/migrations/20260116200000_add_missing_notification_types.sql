-- Add missing notification types: pending_member and unfilled_positions_reminder
-- These types are used by:
--   - pending_member: Notify leaders when a new member requests to join the church
--   - unfilled_positions_reminder: Remind leaders about unfilled positions in upcoming events

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
    'invitation_response',
    'pending_member',
    'unfilled_positions_reminder'
  ));

COMMENT ON COLUMN notifications.type IS 'Type of notification. pending_member is sent to leaders when new members request to join. unfilled_positions_reminder is sent to leaders about upcoming events with unfilled positions.';
