-- Fix the check_user_needs_reconsent function to handle consent records
-- that were created during signup without document_id or document_version.
-- These legacy records should be treated as having accepted version 1.

CREATE OR REPLACE FUNCTION check_user_needs_reconsent(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_needs_reconsent BOOLEAN := false;
  v_doc RECORD;
  v_consent_version INT;
BEGIN
  -- Check TOS and Privacy Policy (required for all users)
  -- Only check documents with 'active' acceptance type
  FOR v_doc IN
    SELECT DISTINCT ON (document_type) document_type, version as current_version
    FROM legal_documents
    WHERE is_current = true
    AND document_type IN ('terms_of_service', 'privacy_policy')
    AND acceptance_type = 'active'  -- Skip silent documents
    ORDER BY document_type, version DESC
  LOOP
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

-- Add comment explaining the function
COMMENT ON FUNCTION check_user_needs_reconsent(UUID) IS
'Checks if a user needs to re-consent to updated legal documents.
Returns true if any active acceptance type document has a newer version
than the user has consented to. Treats consent records without document_version
as version 1 (legacy records from before version tracking).';
