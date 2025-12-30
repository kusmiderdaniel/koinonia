-- Migration: Add pending_registrations table
-- Purpose: Track users who have signed up but await admin approval

CREATE TABLE pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'linked')),
  linked_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, church_id)
);

-- Indexes for performance
CREATE INDEX idx_pending_registrations_church_id ON pending_registrations(church_id);
CREATE INDEX idx_pending_registrations_status ON pending_registrations(status);
CREATE INDEX idx_pending_registrations_user_id ON pending_registrations(user_id);

-- Enable RLS
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own pending registration
CREATE POLICY "Users can view own pending registration"
  ON pending_registrations FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins can view all pending registrations in their church
CREATE POLICY "Admins can view church pending registrations"
  ON pending_registrations FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Admins can update pending registrations in their church
CREATE POLICY "Admins can update church pending registrations"
  ON pending_registrations FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Admins can delete pending registrations in their church
CREATE POLICY "Admins can delete church pending registrations"
  ON pending_registrations FOR DELETE
  USING (
    church_id IN (
      SELECT church_id FROM profiles WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Authenticated users can insert pending registration for themselves
CREATE POLICY "Users can create pending registration"
  ON pending_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER set_pending_registrations_updated_at
  BEFORE UPDATE ON pending_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
