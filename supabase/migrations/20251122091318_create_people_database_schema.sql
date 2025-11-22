-- =====================================================
-- PEOPLE DATABASE SCHEMA
-- =====================================================
-- This migration creates tables for a Notion-like people database
-- with custom fields, sorting, filtering, and saved views

-- =====================================================
-- UPDATE CHURCH_MEMBERS TABLE
-- =====================================================
-- Add contact information to church_members

ALTER TABLE church_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE church_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE church_members ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE church_members ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records with data from profiles
UPDATE church_members cm
SET
  email = p.email,
  phone = p.phone,
  full_name = p.full_name
FROM profiles p
WHERE cm.user_id = p.id
AND cm.email IS NULL;

COMMENT ON COLUMN church_members.email IS 'Member email address (denormalized from profiles for easier querying)';
COMMENT ON COLUMN church_members.phone IS 'Member phone number';
COMMENT ON COLUMN church_members.full_name IS 'Member full name (denormalized from profiles)';
COMMENT ON COLUMN church_members.notes IS 'Admin notes about this member';

-- =====================================================
-- CUSTOM FIELDS TABLE
-- =====================================================
-- Defines custom columns for the people database

CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect')),
  options JSONB DEFAULT '[]'::jsonb, -- For select/multiselect field types
  position INTEGER NOT NULL DEFAULT 0, -- For ordering columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, name)
);

CREATE INDEX custom_fields_church_id_idx ON custom_fields(church_id);
CREATE INDEX custom_fields_position_idx ON custom_fields(church_id, position);

-- Trigger for updated_at
CREATE TRIGGER custom_fields_updated_at
  BEFORE UPDATE ON custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- CUSTOM FIELD VALUES TABLE
-- =====================================================
-- Stores values for custom fields per member

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_member_id UUID NOT NULL REFERENCES church_members(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_date DATE,
  value_select TEXT, -- For single select
  value_multiselect JSONB DEFAULT '[]'::jsonb, -- For multiselect
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_member_id, custom_field_id)
);

CREATE INDEX custom_field_values_member_idx ON custom_field_values(church_member_id);
CREATE INDEX custom_field_values_field_idx ON custom_field_values(custom_field_id);

-- Trigger for updated_at
CREATE TRIGGER custom_field_values_updated_at
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TABLE VIEWS TABLE
-- =====================================================
-- Stores saved table views (filters, sorts, visible columns)

CREATE TABLE table_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB DEFAULT '[]'::jsonb, -- Array of filter conditions
  sorts JSONB DEFAULT '[]'::jsonb, -- Array of sort conditions
  visible_columns JSONB DEFAULT '[]'::jsonb, -- Array of column IDs to show
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, name)
);

CREATE INDEX table_views_church_id_idx ON table_views(church_id);
CREATE INDEX table_views_created_by_idx ON table_views(created_by);

-- Trigger for updated_at
CREATE TRIGGER table_views_updated_at
  BEFORE UPDATE ON table_views
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Custom Fields Policies
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom fields in their churches"
  ON custom_fields FOR SELECT
  USING (
    church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage custom fields in their churches"
  ON custom_fields FOR ALL
  USING (
    church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Custom Field Values Policies
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view custom field values in their churches"
  ON custom_field_values FOR SELECT
  USING (
    church_member_id IN (
      SELECT cm1.id
      FROM church_members cm1
      JOIN church_members cm2 ON cm1.church_id = cm2.church_id
      WHERE cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage custom field values in their churches"
  ON custom_field_values FOR ALL
  USING (
    church_member_id IN (
      SELECT cm1.id
      FROM church_members cm1
      JOIN church_members cm2 ON cm1.church_id = cm2.church_id
      WHERE cm2.user_id = auth.uid()
      AND cm2.role IN ('owner', 'admin', 'leader')
    )
  );

-- Table Views Policies
ALTER TABLE table_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view table views in their churches"
  ON table_views FOR SELECT
  USING (
    church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own table views"
  ON table_views FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND church_id IN (
      SELECT cm.church_id
      FROM church_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own table views"
  ON table_views FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own table views"
  ON table_views FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE custom_fields IS 'Custom field definitions for the people database (Notion-like columns)';
COMMENT ON TABLE custom_field_values IS 'Values for custom fields per church member';
COMMENT ON TABLE table_views IS 'Saved views for the people database (filters, sorts, column visibility)';
