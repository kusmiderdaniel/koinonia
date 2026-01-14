-- Legal Document Management
-- Adds admin panel support with draft/publish workflow and acceptance types

-- ============================================================================
-- 1. ADD STATUS FIELD FOR DRAFT/PUBLISHED WORKFLOW
-- ============================================================================

ALTER TABLE legal_documents
ADD COLUMN status TEXT NOT NULL DEFAULT 'published'
CHECK (status IN ('draft', 'published'));

-- ============================================================================
-- 2. ADD ACCEPTANCE TYPE FOR SILENT VS ACTIVE RECONSENT
-- ============================================================================

ALTER TABLE legal_documents
ADD COLUMN acceptance_type TEXT NOT NULL DEFAULT 'active'
CHECK (acceptance_type IN ('silent', 'active'));

-- ============================================================================
-- 3. ADD PUBLISHED_AT TIMESTAMP
-- ============================================================================

ALTER TABLE legal_documents
ADD COLUMN published_at TIMESTAMPTZ;

-- ============================================================================
-- 4. UPDATE EXISTING RECORDS
-- All existing current documents should be marked as published
-- ============================================================================

UPDATE legal_documents
SET status = 'published',
    published_at = effective_date
WHERE is_current = true;

-- ============================================================================
-- 5. ADD SUPER_ADMIN FLAG TO PROFILES
-- Platform-level admin access for managing legal documents
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- ============================================================================
-- 6. CREATE INDEX FOR STATUS QUERIES
-- ============================================================================

CREATE INDEX idx_legal_documents_status ON legal_documents(status);
CREATE INDEX idx_legal_documents_acceptance_type ON legal_documents(acceptance_type);

-- ============================================================================
-- 7. ADD RLS POLICIES FOR SUPER-ADMIN ACCESS
-- Super admins can manage all legal documents
-- ============================================================================

-- Super admins can read all documents (including drafts)
CREATE POLICY "Super admins can read all legal documents"
  ON legal_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can insert new documents
CREATE POLICY "Super admins can insert legal documents"
  ON legal_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can update documents
CREATE POLICY "Super admins can update legal documents"
  ON legal_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can delete draft documents
CREATE POLICY "Super admins can delete draft legal documents"
  ON legal_documents FOR DELETE
  USING (
    status = 'draft'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ============================================================================
-- 8. CREATE VIEW FOR ACCEPTANCE STATISTICS
-- Aggregates consent data for admin dashboard
-- ============================================================================

CREATE OR REPLACE VIEW legal_document_stats AS
SELECT
  ld.id as document_id,
  ld.document_type,
  ld.version,
  ld.language,
  ld.title,
  ld.status,
  ld.acceptance_type,
  ld.is_current,
  ld.effective_date,
  ld.published_at,
  ld.created_at,
  COUNT(DISTINCT cr.user_id) FILTER (WHERE cr.action = 'granted') as accepted_count,
  COUNT(DISTINCT cr.user_id) FILTER (WHERE cr.action = 'withdrawn') as withdrawn_count
FROM legal_documents ld
LEFT JOIN consent_records cr ON cr.document_id = ld.id
GROUP BY ld.id, ld.document_type, ld.version, ld.language, ld.title,
         ld.status, ld.acceptance_type, ld.is_current, ld.effective_date,
         ld.published_at, ld.created_at;

-- ============================================================================
-- 9. UPDATE RECONSENT CHECK FUNCTION TO HANDLE ACCEPTANCE TYPE
-- Now skips documents with 'silent' acceptance type in reconsent check
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
  -- Only check documents with 'active' acceptance type
  FOR v_doc IN
    SELECT DISTINCT document_type
    FROM legal_documents
    WHERE is_current = true
    AND document_type IN ('terms_of_service', 'privacy_policy')
    AND acceptance_type = 'active'  -- Skip silent documents
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
-- 10. CREATE FUNCTION TO GET NEXT VERSION NUMBER
-- Helper for creating new document versions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_legal_document_version(
  p_document_type TEXT,
  p_language TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_max_version
  FROM legal_documents
  WHERE document_type = p_document_type
  AND language = p_language;

  RETURN v_max_version;
END;
$$;
