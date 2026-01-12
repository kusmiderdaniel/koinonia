-- Add 'internal_anonymous' as a valid access_type for forms
-- This allows internal forms where responses are anonymous (no profile_id stored)

-- Drop the existing constraint
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_access_type_check;

-- Add new constraint with the additional option
ALTER TABLE forms ADD CONSTRAINT forms_access_type_check
  CHECK (access_type IN ('public', 'internal', 'internal_anonymous'));
