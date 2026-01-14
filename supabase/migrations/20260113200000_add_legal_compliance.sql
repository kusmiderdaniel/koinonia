-- Legal Compliance Infrastructure
-- GDPR-compliant consent tracking, legal documents, and user rights management

-- ============================================================================
-- 1. LEGAL DOCUMENTS TABLE
-- Stores versioned legal documents in multiple languages (EN, PL)
-- ============================================================================

CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document identification
  document_type TEXT NOT NULL CHECK (document_type IN (
    'terms_of_service',
    'privacy_policy',
    'dpa',
    'church_admin_terms'
  )),
  version INTEGER NOT NULL DEFAULT 1,
  language TEXT NOT NULL CHECK (language IN ('en', 'pl')),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- Markdown content
  summary TEXT,           -- Brief summary for UI display

  -- Lifecycle
  effective_date TIMESTAMPTZ NOT NULL,
  is_current BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,  -- Will be NULL for seed data

  -- Ensure unique version per document type per language
  UNIQUE(document_type, version, language)
);

-- Indexes for legal_documents
CREATE INDEX idx_legal_documents_type_lang ON legal_documents(document_type, language);
CREATE INDEX idx_legal_documents_current ON legal_documents(document_type, language, is_current)
  WHERE is_current = true;

-- Enable RLS
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can read current legal documents (public access required for sign-up page)
CREATE POLICY "Anyone can read current legal documents"
  ON legal_documents FOR SELECT
  USING (is_current = true);

-- Owners can read all document versions (for admin purposes)
CREATE POLICY "Owners can read all legal document versions"
  ON legal_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- ============================================================================
-- 2. CONSENT RECORDS TABLE
-- Immutable audit trail of all consent events
-- IMPORTANT: No UPDATE or DELETE policies - this table is append-only
-- ============================================================================

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (uses auth.uid directly, survives profile deletion)
  user_id UUID NOT NULL,

  -- Church reference (NULL for platform-level consents like TOS/Privacy)
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

  -- Consent details
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy',
    'dpa',
    'church_admin_terms',
    'data_sharing'
  )),

  -- Document reference
  document_id UUID REFERENCES legal_documents(id) ON DELETE SET NULL,
  document_version INTEGER,

  -- Action (granted or withdrawn)
  action TEXT NOT NULL CHECK (action IN ('granted', 'withdrawn')),

  -- Request metadata (for audit trail)
  ip_address INET,
  user_agent TEXT,

  -- Additional context (JSON for flexibility)
  context JSONB,

  -- For data_sharing consent: what categories were agreed to
  data_categories_shared TEXT[],

  -- Timestamp (immutable)
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for consent_records
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_recorded_at ON consent_records(recorded_at DESC);
CREATE INDEX idx_consent_records_church_id ON consent_records(church_id) WHERE church_id IS NOT NULL;

-- Enable RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent records
CREATE POLICY "Users can view their own consent records"
  ON consent_records FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own consent records
CREATE POLICY "Users can insert their own consent records"
  ON consent_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- NO UPDATE OR DELETE POLICIES - consent records are immutable for GDPR compliance

-- ============================================================================
-- 3. DATA EXPORT REQUESTS TABLE
-- Tracks GDPR data portability requests
-- ============================================================================

CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'expired'
  )),

  -- Download details
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,

  -- Request metadata
  ip_address INET,
  user_agent TEXT
);

-- Indexes for data_export_requests
CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX idx_data_export_requests_expires ON data_export_requests(download_expires_at)
  WHERE status = 'completed';

-- Enable RLS
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own export requests
CREATE POLICY "Users can view their own export requests"
  ON data_export_requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own export requests
CREATE POLICY "Users can insert their own export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own export requests (for status updates via service role)
CREATE POLICY "Users can update their own export requests"
  ON data_export_requests FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4. ACCOUNT DELETION REQUESTS TABLE
-- Tracks GDPR right to erasure requests with anonymization workflow
-- ============================================================================

CREATE TABLE account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Waiting for grace period
    'processing',   -- Currently anonymizing
    'completed',    -- Anonymization complete
    'failed',       -- Error occurred
    'cancelled'     -- User cancelled during grace period
  )),

  -- User-provided reason (optional)
  reason TEXT,

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Grace period tracking
  grace_period_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  cancelled_at TIMESTAMPTZ,

  -- Audit: summary of what was anonymized
  anonymized_data_summary JSONB,

  -- Request metadata
  ip_address INET,
  user_agent TEXT
);

-- Indexes for account_deletion_requests
CREATE INDEX idx_account_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX idx_account_deletion_requests_grace_period ON account_deletion_requests(grace_period_ends_at)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own deletion requests
CREATE POLICY "Users can insert their own deletion requests"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own deletion requests (for cancellation)
CREATE POLICY "Users can update their own deletion requests"
  ON account_deletion_requests FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. HELPER FUNCTION: Check if user needs to re-consent
-- Returns true if user hasn't accepted the current version of required docs
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_needs_reconsent(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_needs_reconsent BOOLEAN := false;
  v_doc RECORD;
BEGIN
  -- Check TOS and Privacy Policy (required for all users)
  FOR v_doc IN
    SELECT DISTINCT document_type
    FROM legal_documents
    WHERE is_current = true
    AND document_type IN ('terms_of_service', 'privacy_policy')
  LOOP
    -- Check if user has granted consent for the current version
    IF NOT EXISTS (
      SELECT 1 FROM consent_records cr
      JOIN legal_documents ld ON cr.document_id = ld.id
      WHERE cr.user_id = p_user_id
      AND cr.consent_type = v_doc.document_type
      AND cr.action = 'granted'
      AND ld.is_current = true
    ) THEN
      v_needs_reconsent := true;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_needs_reconsent;
END;
$$;

-- ============================================================================
-- 6. HELPER FUNCTION: Get user's current consent status
-- Returns a list of document types and their consent status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_consent_status(p_user_id UUID)
RETURNS TABLE (
  document_type TEXT,
  has_current_consent BOOLEAN,
  consented_version INTEGER,
  current_version INTEGER,
  consented_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.document_type,
    CASE WHEN cr.id IS NOT NULL THEN true ELSE false END as has_current_consent,
    cr.document_version as consented_version,
    ld.version as current_version,
    cr.recorded_at as consented_at
  FROM legal_documents ld
  LEFT JOIN LATERAL (
    SELECT cr2.id, cr2.document_version, cr2.recorded_at
    FROM consent_records cr2
    WHERE cr2.user_id = p_user_id
    AND cr2.consent_type = ld.document_type
    AND cr2.action = 'granted'
    AND cr2.document_id = ld.id
    ORDER BY cr2.recorded_at DESC
    LIMIT 1
  ) cr ON true
  WHERE ld.is_current = true
  AND ld.language = 'en';  -- Use EN as reference for version checking
END;
$$;

-- ============================================================================
-- 7. CREATE STORAGE BUCKET FOR DATA EXPORTS
-- Private bucket for storing user data export files
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('data-exports', 'data-exports', false, 52428800)  -- 50MB limit
ON CONFLICT (id) DO NOTHING;

-- RLS for data-exports bucket
CREATE POLICY "Users can download their own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'data-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can upload exports (no user-facing upload policy)
