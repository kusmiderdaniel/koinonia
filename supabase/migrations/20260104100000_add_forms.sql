-- Forms feature: form builder with drag-and-drop, conditional logic, and response management
-- Supports both public (token-based) and internal (authenticated) forms

-- ============================================================================
-- 1. FORMS TABLE - Main form definitions
-- ============================================================================
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  access_type TEXT NOT NULL DEFAULT 'internal' CHECK (access_type IN ('public', 'internal')),
  public_token TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Indexes for forms
CREATE INDEX idx_forms_church_id ON forms(church_id);
CREATE INDEX idx_forms_public_token ON forms(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_created_by ON forms(created_by);

-- ============================================================================
-- 2. FORM FIELDS TABLE - Field definitions with ordering
-- ============================================================================
CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'number', 'email', 'date', 'single_select', 'multi_select', 'checkbox')),
  label TEXT NOT NULL,
  description TEXT,
  placeholder TEXT,
  required BOOLEAN DEFAULT false,
  options JSONB, -- For single_select/multi_select: [{"value": "opt1", "label": "Option 1"}, ...]
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for form_fields
CREATE INDEX idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX idx_form_fields_sort_order ON form_fields(form_id, sort_order);

-- ============================================================================
-- 3. FORM CONDITIONS TABLE - Conditional logic rules
-- ============================================================================
CREATE TABLE form_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  target_field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  source_field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  operator TEXT NOT NULL CHECK (operator IN ('equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty')),
  value TEXT,
  action TEXT NOT NULL DEFAULT 'show' CHECK (action IN ('show', 'hide')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for form_conditions
CREATE INDEX idx_form_conditions_form_id ON form_conditions(form_id);
CREATE INDEX idx_form_conditions_target ON form_conditions(target_field_id);
CREATE INDEX idx_form_conditions_source ON form_conditions(source_field_id);

-- ============================================================================
-- 4. FORM SUBMISSIONS TABLE - Response records
-- ============================================================================
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  respondent_email TEXT,
  responses JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Indexes for form_submissions
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_respondent ON form_submissions(respondent_id);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(form_id, submitted_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- FORMS POLICIES
-- ----------------------------------------------------------------------------

-- Leaders+ can view all forms in their church
CREATE POLICY "Leaders can view all forms"
  ON forms FOR SELECT
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- All church members can view published internal forms (to submit responses)
CREATE POLICY "Members can view published internal forms"
  ON forms FOR SELECT
  USING (
    church_id = get_user_church_id()
    AND status = 'published'
    AND access_type = 'internal'
  );

-- Leaders+ can create forms
CREATE POLICY "Leaders can create forms"
  ON forms FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can update forms
CREATE POLICY "Leaders can update forms"
  ON forms FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  )
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can delete forms
CREATE POLICY "Leaders can delete forms"
  ON forms FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- ----------------------------------------------------------------------------
-- FORM FIELDS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view fields of forms they can access
CREATE POLICY "Users can view fields of accessible forms"
  ON form_fields FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
  );

-- Leaders+ can manage form fields
CREATE POLICY "Leaders can insert form fields"
  ON form_fields FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Leaders can update form fields"
  ON form_fields FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Leaders can delete form fields"
  ON form_fields FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- ----------------------------------------------------------------------------
-- FORM CONDITIONS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view conditions of forms they can access
CREATE POLICY "Users can view conditions of accessible forms"
  ON form_conditions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
  );

-- Leaders+ can manage form conditions
CREATE POLICY "Leaders can insert form conditions"
  ON form_conditions FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Leaders can update form conditions"
  ON form_conditions FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Leaders can delete form conditions"
  ON form_conditions FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- ----------------------------------------------------------------------------
-- FORM SUBMISSIONS POLICIES
-- ----------------------------------------------------------------------------

-- Leaders+ can view all submissions for their church's forms
CREATE POLICY "Leaders can view all submissions"
  ON form_submissions FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Authenticated users can submit to internal forms
CREATE POLICY "Authenticated users can submit to internal forms"
  ON form_submissions FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms
      WHERE church_id = get_user_church_id()
      AND status = 'published'
      AND access_type = 'internal'
    )
    AND respondent_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- NOTE: Public form submissions are handled via service role client in API route
-- to bypass RLS since anonymous users don't have auth.uid()

-- ============================================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to forms table
CREATE TRIGGER forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_forms_updated_at();

-- Apply trigger to form_fields table
CREATE TRIGGER form_fields_updated_at
  BEFORE UPDATE ON form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_forms_updated_at();
