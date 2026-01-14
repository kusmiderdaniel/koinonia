-- Migration: Add legal document disagreement workflow tables
-- This supports the silent acceptance notification flow with PDF attachments
-- and the user/church deletion workflow for those who disagree with document updates

-- ============================================
-- Table: legal_disagreements
-- Tracks user disagreements with legal document updates
-- ============================================
CREATE TABLE legal_disagreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who disagreed
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Church affected (for DPA/Admin Terms - church deletion)
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

  -- Document reference
  document_id UUID REFERENCES legal_documents(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'terms_of_service',
    'privacy_policy',
    'dpa',
    'church_admin_terms'
  )),
  document_version INTEGER NOT NULL,

  -- Disagreement type determines consequences
  -- user_deletion: ToS/PP disagreement leads to user account deletion
  -- church_deletion: DPA/AT disagreement leads to church deletion
  disagreement_type TEXT NOT NULL CHECK (disagreement_type IN (
    'user_deletion',
    'church_deletion'
  )),

  -- Status tracking
  -- pending: Waiting for deadline to pass
  -- withdrawn: User re-agreed before deadline (cancelled disagreement)
  -- processing: Currently processing the deletion
  -- completed: Deletion has been completed
  -- transferred: Church ownership was transferred (avoided deletion)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'withdrawn',
    'processing',
    'completed',
    'transferred'
  )),

  -- Deadline tracking
  -- For ToS/PP: effective_date + 14 days
  -- For DPA/AT: effective_date + 30 days
  deadline_at TIMESTAMPTZ NOT NULL,

  -- For church deletions, track when member warning emails were sent
  warning_email_sent_at TIMESTAMPTZ,

  -- Audit metadata
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Request metadata for audit trail
  ip_address INET,
  user_agent TEXT,

  -- Password verification timestamp (required to confirm disagreement)
  verified_at TIMESTAMPTZ,

  -- Optional reason provided by user
  reason TEXT
);

-- ============================================
-- Table: church_deletion_schedules
-- Tracks scheduled church deletions for member notifications
-- Separate from legal_disagreements for easier querying of scheduled deletions
-- ============================================
CREATE TABLE church_deletion_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Church being deleted
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Link to the disagreement that triggered this
  disagreement_id UUID NOT NULL REFERENCES legal_disagreements(id) ON DELETE CASCADE,

  -- When the church will be deleted
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,

  -- Track when member notification emails were sent (10 days before deletion)
  member_notification_sent_at TIMESTAMPTZ,

  -- Status tracking
  -- pending: Waiting, members not yet notified
  -- notified: Members have been sent warning emails
  -- cancelled: Deletion cancelled (ownership transferred or owner re-agreed)
  -- completed: Church has been deleted
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'notified',
    'cancelled',
    'completed'
  )),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================

-- Legal disagreements indexes
CREATE INDEX idx_legal_disagreements_user_id ON legal_disagreements(user_id);
CREATE INDEX idx_legal_disagreements_church_id ON legal_disagreements(church_id)
  WHERE church_id IS NOT NULL;
CREATE INDEX idx_legal_disagreements_status ON legal_disagreements(status);
CREATE INDEX idx_legal_disagreements_deadline ON legal_disagreements(deadline_at)
  WHERE status = 'pending';
CREATE INDEX idx_legal_disagreements_type ON legal_disagreements(disagreement_type);

-- Church deletion schedule indexes
CREATE INDEX idx_church_deletion_schedules_church_id ON church_deletion_schedules(church_id);
CREATE INDEX idx_church_deletion_schedules_status ON church_deletion_schedules(status);
CREATE INDEX idx_church_deletion_schedules_scheduled ON church_deletion_schedules(scheduled_deletion_at)
  WHERE status IN ('pending', 'notified');
-- Index for finding churches that need member notification (10 days before deletion)
CREATE INDEX idx_church_deletion_schedules_notification
  ON church_deletion_schedules(scheduled_deletion_at, member_notification_sent_at)
  WHERE status = 'pending' AND member_notification_sent_at IS NULL;

-- ============================================
-- Add column to legal_documents for tracking silent acceptance emails
-- ============================================
ALTER TABLE legal_documents
ADD COLUMN IF NOT EXISTS silent_notification_sent_at TIMESTAMPTZ;

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE legal_disagreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_deletion_schedules ENABLE ROW LEVEL SECURITY;

-- Users can view their own disagreements
CREATE POLICY "Users can view their own disagreements"
  ON legal_disagreements FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own disagreements
CREATE POLICY "Users can insert their own disagreements"
  ON legal_disagreements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending disagreements (to withdraw/re-agree)
CREATE POLICY "Users can update their own pending disagreements"
  ON legal_disagreements FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Super admins can view all disagreements (for admin dashboard)
CREATE POLICY "Super admins can view all disagreements"
  ON legal_disagreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can update any disagreement (for processing)
CREATE POLICY "Super admins can update any disagreement"
  ON legal_disagreements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Church owners can view their church's deletion schedule
CREATE POLICY "Church owners can view deletion schedules"
  ON church_deletion_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.church_id = church_deletion_schedules.church_id
      AND profiles.role = 'owner'
    )
  );

-- Super admins can view all church deletion schedules
CREATE POLICY "Super admins can view all deletion schedules"
  ON church_deletion_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can update church deletion schedules
CREATE POLICY "Super admins can update deletion schedules"
  ON church_deletion_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can insert church deletion schedules
CREATE POLICY "Super admins can insert deletion schedules"
  ON church_deletion_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ============================================
-- Helper function to check if user has pending disagreement
-- ============================================
CREATE OR REPLACE FUNCTION check_user_has_pending_disagreement(p_user_id UUID)
RETURNS TABLE (
  has_pending BOOLEAN,
  document_type TEXT,
  deadline_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS has_pending,
    ld.document_type,
    ld.deadline_at
  FROM legal_disagreements ld
  WHERE ld.user_id = p_user_id
    AND ld.status = 'pending'
  ORDER BY ld.deadline_at ASC
  LIMIT 1;

  -- Return false if no pending disagreements
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE legal_disagreements IS 'Tracks user disagreements with legal document updates. For ToS/PP, leads to account deletion after deadline. For DPA/AT, leads to church deletion.';
COMMENT ON TABLE church_deletion_schedules IS 'Tracks scheduled church deletions due to owner disagreeing with DPA/Admin Terms. Used to send member warning emails 10 days before deletion.';
COMMENT ON COLUMN legal_disagreements.disagreement_type IS 'user_deletion = ToS/PP (account deleted), church_deletion = DPA/AT (church deleted)';
COMMENT ON COLUMN legal_disagreements.deadline_at IS 'ToS/PP: effective_date + 14 days. DPA/AT: effective_date + 30 days.';
COMMENT ON COLUMN legal_documents.silent_notification_sent_at IS 'Timestamp when silent acceptance notification emails with PDF were sent';
