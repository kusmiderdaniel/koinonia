-- Custom Fields for People Table
-- Allows churches to define their own fields with various types

-- ============================================================================
-- TABLE: custom_field_definitions
-- Stores field definitions per church
-- ============================================================================

CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Field metadata
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'date', 'select', 'multiselect', 'checkbox', 'number')),
  description TEXT,

  -- Field configuration (JSONB for flexibility)
  options JSONB DEFAULT '[]',  -- For select/multiselect: [{value, label, color}]
  settings JSONB DEFAULT '{}', -- For number: {format, decimals, prefix, suffix, min, max}

  -- Display settings
  display_order INTEGER NOT NULL DEFAULT 0,
  default_visible BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_custom_field_definitions_church ON custom_field_definitions(church_id);
CREATE INDEX idx_custom_field_definitions_order ON custom_field_definitions(church_id, display_order);

-- RLS
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

-- All church members can view custom field definitions
CREATE POLICY "Users can view custom fields from their church"
  ON custom_field_definitions FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Only admins and owners can insert custom field definitions
CREATE POLICY "Admins can create custom fields"
  ON custom_field_definitions FOR INSERT
  WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Only admins and owners can update custom field definitions
CREATE POLICY "Admins can update custom fields"
  ON custom_field_definitions FOR UPDATE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Only admins and owners can delete custom field definitions
CREATE POLICY "Admins can delete custom fields"
  ON custom_field_definitions FOR DELETE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- TABLE: custom_field_values
-- Stores actual values per member per field
-- ============================================================================

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,

  -- Value storage (JSONB for type flexibility)
  -- text: "string", date: "2024-01-15", select: "option_value",
  -- multiselect: ["val1", "val2"], checkbox: true, number: 123.45
  value JSONB,

  -- Metadata
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Each profile can only have one value per field
  UNIQUE(profile_id, field_id)
);

-- Indexes
CREATE INDEX idx_custom_field_values_profile ON custom_field_values(profile_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_id);
CREATE INDEX idx_custom_field_values_church ON custom_field_values(church_id);
CREATE INDEX idx_custom_field_values_value ON custom_field_values USING GIN (value);

-- RLS
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

-- All church members can view custom field values
CREATE POLICY "Users can view custom field values from their church"
  ON custom_field_values FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Leaders and above can insert custom field values
CREATE POLICY "Leaders can create custom field values"
  ON custom_field_values FOR INSERT
  WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('leader', 'admin', 'owner')
    )
  );

-- Leaders and above can update custom field values
CREATE POLICY "Leaders can update custom field values"
  ON custom_field_values FOR UPDATE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('leader', 'admin', 'owner')
    )
  )
  WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('leader', 'admin', 'owner')
    )
  );

-- Leaders and above can delete custom field values
CREATE POLICY "Leaders can delete custom field values"
  ON custom_field_values FOR DELETE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('leader', 'admin', 'owner')
    )
  );

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE custom_field_definitions IS 'Stores custom field definitions created by churches for their People table';
COMMENT ON COLUMN custom_field_definitions.field_type IS 'Type of field: text, date, select, multiselect, checkbox, number';
COMMENT ON COLUMN custom_field_definitions.options IS 'For select/multiselect fields: array of {value, label, color} objects';
COMMENT ON COLUMN custom_field_definitions.settings IS 'Field-specific settings like number format, decimals, prefix, suffix, min, max';
COMMENT ON COLUMN custom_field_definitions.display_order IS 'Order in which fields appear in the table (0-indexed)';

COMMENT ON TABLE custom_field_values IS 'Stores values for custom fields per member';
COMMENT ON COLUMN custom_field_values.value IS 'JSONB value: text="string", date="2024-01-15", select="option", multiselect=["a","b"], checkbox=true, number=123.45';
