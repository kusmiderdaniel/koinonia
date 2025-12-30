-- Add invitation workflow: status tracking for event assignments and notifications table

-- =============================================================================
-- 1. Update event_assignments table with status tracking
-- =============================================================================

ALTER TABLE event_assignments
  ADD COLUMN status TEXT CHECK (status IS NULL OR status IN ('invited', 'accepted', 'declined', 'expired')),
  ADD COLUMN invited_at TIMESTAMPTZ,
  ADD COLUMN responded_at TIMESTAMPTZ;

-- Create indexes for efficient querying
CREATE INDEX idx_event_assignments_status ON event_assignments(status);
CREATE INDEX idx_event_assignments_profile_status ON event_assignments(profile_id, status);

-- =============================================================================
-- 2. Create notifications table
-- =============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('position_invitation', 'assignment_reminder', 'event_update', 'general')),
  title TEXT NOT NULL,
  message TEXT,
  -- References to related entities
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES event_assignments(id) ON DELETE CASCADE,
  -- State tracking
  is_read BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  action_taken TEXT CHECK (action_taken IS NULL OR action_taken IN ('accepted', 'declined', 'expired')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_church_id ON notifications(church_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_assignment_id ON notifications(assignment_id);
CREATE INDEX idx_notifications_event_id ON notifications(event_id);

-- =============================================================================
-- 3. Enable RLS and create policies for notifications
-- =============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Users can update their own notifications (mark as read, respond)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Admins and leaders can insert notifications for their church
CREATE POLICY "Admins and leaders can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Admins can delete notifications in their church
CREATE POLICY "Admins can delete notifications"
  ON notifications FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 4. Function to expire pending invitations when event starts
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_pending_invitations()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if start_time has changed and event is now in the past
  IF NEW.start_time <= NOW() AND (OLD.start_time IS NULL OR OLD.start_time > NOW()) THEN
    -- Update all 'invited' assignments for this event to 'expired'
    UPDATE event_assignments ea
    SET
      status = 'expired',
      responded_at = NOW()
    FROM event_positions ep
    WHERE ea.position_id = ep.id
      AND ep.event_id = NEW.id
      AND ea.status = 'invited';

    -- Also mark related notifications as expired
    UPDATE notifications n
    SET
      is_actioned = true,
      action_taken = 'expired',
      actioned_at = NOW()
    FROM event_assignments ea
    JOIN event_positions ep ON ea.position_id = ep.id
    WHERE n.assignment_id = ea.id
      AND ep.event_id = NEW.id
      AND n.type = 'position_invitation'
      AND n.is_actioned = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to expire invitations when event is updated
CREATE TRIGGER expire_invitations_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION expire_pending_invitations();

-- =============================================================================
-- 5. Function to check and expire old invitations (for cron job)
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_past_event_invitations()
RETURNS void AS $$
BEGIN
  -- Expire all 'invited' assignments for events that have started
  UPDATE event_assignments ea
  SET
    status = 'expired',
    responded_at = NOW()
  FROM event_positions ep
  JOIN events e ON ep.event_id = e.id
  WHERE ea.position_id = ep.id
    AND e.start_time <= NOW()
    AND ea.status = 'invited';

  -- Mark related notifications as expired
  UPDATE notifications n
  SET
    is_actioned = true,
    action_taken = 'expired',
    actioned_at = NOW()
  WHERE n.type = 'position_invitation'
    AND n.is_actioned = false
    AND n.expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
