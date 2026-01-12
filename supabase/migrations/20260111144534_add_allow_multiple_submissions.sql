-- Add allow_multiple_submissions column to forms table
-- This setting only applies to internal (non-anonymous) forms
-- Default is false to maintain backwards compatibility (one submission per user)

ALTER TABLE forms ADD COLUMN allow_multiple_submissions BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN forms.allow_multiple_submissions IS 'When true, users can submit internal forms multiple times. Only applies to internal (non-anonymous) forms.';
