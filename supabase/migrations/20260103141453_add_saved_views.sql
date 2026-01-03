-- =============================================================================
-- Migration: Add saved_views table
-- Purpose: Enable church leaders/admins to save filter/sort/group configurations
--          as reusable views that all church members can access
-- =============================================================================

-- =============================================================================
-- 1. Create saved_views table
-- =============================================================================

CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- View identification
  view_type TEXT NOT NULL CHECK (view_type IN ('people', 'tasks')),
  name TEXT NOT NULL,
  description TEXT,

  -- View configuration (stored as JSONB for flexibility)
  filter_state JSONB NOT NULL DEFAULT '{"conjunction":"and","rules":[],"groups":[]}',
  sort_state JSONB NOT NULL DEFAULT '[]',
  group_by TEXT, -- Only used for tasks: 'none' | 'priority' | 'assignee' | 'ministry' | 'campus'

  -- Default designation (only one per view_type per church)
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Audit fields
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Create indexes
-- =============================================================================

CREATE INDEX idx_saved_views_church_id ON saved_views(church_id);
CREATE INDEX idx_saved_views_view_type ON saved_views(view_type);
CREATE INDEX idx_saved_views_church_view_type ON saved_views(church_id, view_type);
CREATE INDEX idx_saved_views_created_by ON saved_views(created_by);

-- Unique partial index ensures only one default view per view_type per church
CREATE UNIQUE INDEX idx_saved_views_default_unique
  ON saved_views(church_id, view_type)
  WHERE is_default = true;

-- =============================================================================
-- 3. Enable RLS
-- =============================================================================

ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. RLS policies
-- =============================================================================

-- All church members can view saved views
CREATE POLICY "Users can view saved views in their church"
  ON saved_views FOR SELECT
  USING (church_id = get_user_church_id());

-- Only leaders and admins can create views
CREATE POLICY "Leaders and admins can create saved views"
  ON saved_views FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Only leaders and admins can update views
CREATE POLICY "Leaders and admins can update saved views"
  ON saved_views FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Creator or admins can delete views
CREATE POLICY "Admins or creator can delete saved views"
  ON saved_views FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
      )
    )
  );

-- =============================================================================
-- 5. Add updated_at trigger
-- =============================================================================

CREATE TRIGGER update_saved_views_updated_at
  BEFORE UPDATE ON saved_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
