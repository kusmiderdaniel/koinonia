-- Migration: Add campus tables and helper functions
-- This adds multi-campus support to churches

-- ============================================================================
-- TABLES
-- ============================================================================

-- campuses: Campus definitions for churches
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, name)
);

-- profile_campuses: Many-to-many relationship between profiles and campuses
CREATE TABLE profile_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, campus_id)
);

-- event_campuses: Many-to-many relationship between events and campuses
CREATE TABLE event_campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  UNIQUE(event_id, campus_id)
);

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- Add campus_id to ministries (each ministry belongs to one campus)
ALTER TABLE ministries ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

-- Add campus_id to event_templates (each template belongs to one campus)
ALTER TABLE event_templates ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

-- Add campus_id to pending_registrations (for campus selection during join)
ALTER TABLE pending_registrations ADD COLUMN campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for efficient lookups
CREATE INDEX idx_campuses_church_id ON campuses(church_id);
CREATE INDEX idx_campuses_is_default ON campuses(church_id, is_default) WHERE is_default = true;
CREATE INDEX idx_profile_campuses_profile_id ON profile_campuses(profile_id);
CREATE INDEX idx_profile_campuses_campus_id ON profile_campuses(campus_id);
CREATE INDEX idx_event_campuses_event_id ON event_campuses(event_id);
CREATE INDEX idx_event_campuses_campus_id ON event_campuses(campus_id);
CREATE INDEX idx_ministries_campus_id ON ministries(campus_id);
CREATE INDEX idx_event_templates_campus_id ON event_templates(campus_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's campus IDs (returns array of campus IDs the user belongs to)
CREATE OR REPLACE FUNCTION get_user_campus_ids()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(ARRAY_AGG(pc.campus_id), ARRAY[]::UUID[])
  FROM profile_campuses pc
  JOIN profiles p ON pc.profile_id = p.id
  WHERE p.user_id = auth.uid()
$$;

-- Check if current user is admin or owner (bypasses campus filtering)
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

-- Check if user has access to an event based on campus membership
-- Returns true if: user is admin/owner OR user shares a campus with the event OR event has no campus assignments
CREATE OR REPLACE FUNCTION user_has_event_campus_access(target_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    is_admin_or_owner()
    OR EXISTS (
      SELECT 1 FROM event_campuses ec
      JOIN profile_campuses pc ON ec.campus_id = pc.campus_id
      JOIN profiles p ON pc.profile_id = p.id
      WHERE p.user_id = auth.uid() AND ec.event_id = target_event_id
    )
    OR NOT EXISTS (SELECT 1 FROM event_campuses WHERE event_id = target_event_id)
$$;

-- Check if user has access to a ministry based on campus
-- Returns true if: user is admin/owner OR ministry's campus matches user's campuses OR ministry has no campus
CREATE OR REPLACE FUNCTION user_has_ministry_campus_access(target_ministry_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    is_admin_or_owner()
    OR EXISTS (
      SELECT 1 FROM ministries m
      JOIN profile_campuses pc ON m.campus_id = pc.campus_id
      JOIN profiles p ON pc.profile_id = p.id
      WHERE p.user_id = auth.uid() AND m.id = target_ministry_id
    )
    OR EXISTS (
      SELECT 1 FROM ministries WHERE id = target_ministry_id AND campus_id IS NULL
    )
$$;

-- Check if user has access to an event template based on campus
CREATE OR REPLACE FUNCTION user_has_template_campus_access(target_template_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    is_admin_or_owner()
    OR EXISTS (
      SELECT 1 FROM event_templates et
      JOIN profile_campuses pc ON et.campus_id = pc.campus_id
      JOIN profiles p ON pc.profile_id = p.id
      WHERE p.user_id = auth.uid() AND et.id = target_template_id
    )
    OR EXISTS (
      SELECT 1 FROM event_templates WHERE id = target_template_id AND campus_id IS NULL
    )
$$;

-- Get default campus for a church
CREATE OR REPLACE FUNCTION get_default_campus_id(target_church_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM campuses
  WHERE church_id = target_church_id AND is_default = true
  LIMIT 1
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Ensure only one default campus per church
CREATE OR REPLACE FUNCTION ensure_single_default_campus()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE campuses
    SET is_default = false
    WHERE church_id = NEW.church_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ensure_single_default_campus
  BEFORE INSERT OR UPDATE OF is_default ON campuses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_campus();

-- Update updated_at timestamp for campuses
CREATE TRIGGER update_campuses_updated_at
  BEFORE UPDATE ON campuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
