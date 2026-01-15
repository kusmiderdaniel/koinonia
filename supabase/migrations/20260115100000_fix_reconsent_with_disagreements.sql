-- Fix the check_user_needs_reconsent function to account for pending disagreements.
-- Users who have a pending disagreement should NOT be redirected to reconsent -
-- they have already made their choice and are in the grace period before deletion.

CREATE OR REPLACE FUNCTION check_user_needs_reconsent(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_needs_reconsent BOOLEAN := false;
  v_doc RECORD;
  v_consent_version INT;
  v_has_pending_disagreement BOOLEAN;
BEGIN
  -- Check TOS and Privacy Policy (required for all users)
  -- Only check documents with 'active' acceptance type
  FOR v_doc IN
    SELECT DISTINCT ON (document_type) id, document_type, version as current_version
    FROM legal_documents
    WHERE is_current = true
    AND document_type IN ('terms_of_service', 'privacy_policy')
    AND acceptance_type = 'active'  -- Skip silent documents
    ORDER BY document_type, version DESC
  LOOP
    -- First, check if user has a pending disagreement for this document
    SELECT EXISTS (
      SELECT 1
      FROM legal_disagreements ld
      WHERE ld.user_id = p_user_id
      AND ld.document_id = v_doc.id
      AND ld.status = 'pending'
    ) INTO v_has_pending_disagreement;

    -- If user has a pending disagreement, they don't need to reconsent
    -- (they've made their choice and are in the grace period)
    IF v_has_pending_disagreement THEN
      CONTINUE;  -- Skip this document, check next one
    END IF;

    -- Get the user's most recent granted consent version for this document type
    SELECT COALESCE(cr.document_version, 1) INTO v_consent_version
    FROM consent_records cr
    WHERE cr.user_id = p_user_id
    AND cr.consent_type = v_doc.document_type
    AND cr.action = 'granted'
    ORDER BY cr.recorded_at DESC
    LIMIT 1;

    -- If no consent record exists, or version is less than current, needs reconsent
    IF v_consent_version IS NULL OR v_consent_version < v_doc.current_version THEN
      v_needs_reconsent := true;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_needs_reconsent;
END;
$$;

-- Add updated comment explaining the function
COMMENT ON FUNCTION check_user_needs_reconsent(UUID) IS
'Checks if a user needs to re-consent to updated legal documents.
Returns true if any active acceptance type document has a newer version
than the user has consented to, UNLESS the user has a pending disagreement
for that document (meaning they are in the grace period before deletion).
Treats consent records without document_version as version 1 (legacy records).';
