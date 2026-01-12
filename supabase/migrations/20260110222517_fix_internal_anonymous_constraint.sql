-- Fix: Drop the inline CHECK constraint on access_type and recreate with internal_anonymous
-- The original constraint was created inline without a name, so we need to find and drop it

-- First, drop any existing named constraint we tried to add
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_access_type_check;

-- Drop RLS policies that depend on access_type
DROP POLICY IF EXISTS "Members can view published internal forms" ON forms;
DROP POLICY IF EXISTS "Authenticated users can submit to internal forms" ON form_submissions;

-- Step 1: Add a temporary column
ALTER TABLE forms ADD COLUMN access_type_new TEXT;

-- Step 2: Copy the data
UPDATE forms SET access_type_new = access_type;

-- Step 3: Drop the old column (this drops the inline constraint too)
ALTER TABLE forms DROP COLUMN access_type;

-- Step 4: Rename the new column
ALTER TABLE forms RENAME COLUMN access_type_new TO access_type;

-- Step 5: Set NOT NULL and default
ALTER TABLE forms ALTER COLUMN access_type SET NOT NULL;
ALTER TABLE forms ALTER COLUMN access_type SET DEFAULT 'internal';

-- Step 6: Add the new constraint with internal_anonymous
ALTER TABLE forms ADD CONSTRAINT forms_access_type_check
  CHECK (access_type IN ('public', 'internal', 'internal_anonymous'));

-- Recreate RLS policies
-- Members can view published internal forms (now including internal_anonymous)
CREATE POLICY "Members can view published internal forms"
ON forms FOR SELECT
USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  AND status = 'published'
  AND access_type IN ('internal', 'internal_anonymous')
);

-- Authenticated users can submit to internal forms (now including internal_anonymous)
CREATE POLICY "Authenticated users can submit to internal forms"
ON form_submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM forms f
    WHERE f.id = form_id
    AND f.church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND f.status = 'published'
    AND f.access_type IN ('internal', 'internal_anonymous')
  )
);
