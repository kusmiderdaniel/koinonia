-- Fix the legal_document_stats view to use 'id' instead of 'document_id'
-- for consistency with the legal_documents table and client code expectations

DROP VIEW IF EXISTS legal_document_stats;

CREATE VIEW legal_document_stats AS
SELECT
  ld.id,
  ld.document_type,
  ld.version,
  ld.language,
  ld.title,
  ld.content,
  ld.summary,
  ld.status,
  ld.acceptance_type,
  ld.is_current,
  ld.effective_date,
  ld.published_at,
  ld.created_at,
  ld.created_by,
  COUNT(DISTINCT cr.user_id) FILTER (WHERE cr.action = 'granted') as accepted_count,
  COUNT(DISTINCT cr.user_id) FILTER (WHERE cr.action = 'withdrawn') as withdrawn_count
FROM legal_documents ld
LEFT JOIN consent_records cr ON cr.document_id = ld.id
GROUP BY ld.id, ld.document_type, ld.version, ld.language, ld.title, ld.content,
         ld.summary, ld.status, ld.acceptance_type, ld.is_current, ld.effective_date,
         ld.published_at, ld.created_at, ld.created_by;
