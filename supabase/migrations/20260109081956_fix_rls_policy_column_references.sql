-- =============================================================================
-- Migration: Fix Critical RLS Policy Column Reference Issues
-- Purpose: Correct RLS policies that incorrectly use profiles.id = auth.uid()
--          instead of profiles.user_id = auth.uid()
--
-- Background: The profiles table has two key columns:
--   - id: UUID (profile's unique identifier, used as FK in other tables)
--   - user_id: UUID (references auth.users.id, used for authentication)
--
-- auth.uid() returns the auth.users.id, which matches profiles.user_id, NOT profiles.id
-- Several migrations created after this pattern was established incorrectly used
-- the old pattern, causing RLS policies to fail silently.
--
-- Affected tables:
--   1. event_templates - All policies
--   2. event_template_agenda_items - All policies
--   3. event_template_positions - All policies
--   4. agenda_item_presets - All policies
--   5. saved_views - INSERT, UPDATE, DELETE policies
--   6. notifications - SELECT and UPDATE policies
-- =============================================================================

-- =============================================================================
-- 1. FIX: event_templates RLS policies
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view templates in their church" ON event_templates;
DROP POLICY IF EXISTS "Leaders can create templates" ON event_templates;
DROP POLICY IF EXISTS "Leaders can update templates" ON event_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON event_templates;

-- Recreate with correct column references
CREATE POLICY "Users can view templates in their church"
  ON event_templates FOR SELECT
  USING (church_id = get_user_church_id());

CREATE POLICY "Leaders can create templates"
  ON event_templates FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Leaders can update templates"
  ON event_templates FOR UPDATE
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

CREATE POLICY "Admins can delete templates"
  ON event_templates FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 2. FIX: event_template_agenda_items RLS policies
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view template agenda items in their church" ON event_template_agenda_items;
DROP POLICY IF EXISTS "Leaders can manage template agenda items" ON event_template_agenda_items;

-- Recreate with correct column references
CREATE POLICY "Users can view template agenda items in their church"
  ON event_template_agenda_items FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = get_user_church_id()
    )
  );

CREATE POLICY "Leaders can manage template agenda items"
  ON event_template_agenda_items FOR ALL
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- =============================================================================
-- 3. FIX: event_template_positions RLS policies
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view template positions in their church" ON event_template_positions;
DROP POLICY IF EXISTS "Leaders can manage template positions" ON event_template_positions;

-- Recreate with correct column references
CREATE POLICY "Users can view template positions in their church"
  ON event_template_positions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = get_user_church_id()
    )
  );

CREATE POLICY "Leaders can manage template positions"
  ON event_template_positions FOR ALL
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- =============================================================================
-- 4. FIX: agenda_item_presets RLS policies
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view presets from their church" ON agenda_item_presets;
DROP POLICY IF EXISTS "Users can insert presets for their church" ON agenda_item_presets;
DROP POLICY IF EXISTS "Users can update presets from their church" ON agenda_item_presets;
DROP POLICY IF EXISTS "Users can delete presets from their church" ON agenda_item_presets;

-- Recreate with helper function (more efficient and correct)
CREATE POLICY "Users can view presets from their church"
  ON agenda_item_presets FOR SELECT
  USING (church_id = get_user_church_id());

CREATE POLICY "Users can insert presets for their church"
  ON agenda_item_presets FOR INSERT
  WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update presets from their church"
  ON agenda_item_presets FOR UPDATE
  USING (church_id = get_user_church_id())
  WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can delete presets from their church"
  ON agenda_item_presets FOR DELETE
  USING (church_id = get_user_church_id());

-- =============================================================================
-- 5. FIX: saved_views RLS policies (INSERT, UPDATE, DELETE only)
-- Note: SELECT policy already uses get_user_church_id() correctly
-- =============================================================================

-- Drop existing policies that have incorrect column references
DROP POLICY IF EXISTS "Leaders and admins can create saved views" ON saved_views;
DROP POLICY IF EXISTS "Leaders and admins can update saved views" ON saved_views;
DROP POLICY IF EXISTS "Admins or creator can delete saved views" ON saved_views;

-- Recreate with correct column references
CREATE POLICY "Leaders and admins can create saved views"
  ON saved_views FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

CREATE POLICY "Leaders and admins can update saved views"
  ON saved_views FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- For DELETE: creator check uses get_user_profile_id() since created_by references profiles.id
CREATE POLICY "Admins or creator can delete saved views"
  ON saved_views FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND (
      created_by = get_user_profile_id()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('owner', 'admin')
      )
    )
  );

-- =============================================================================
-- 6. FIX: notifications RLS policies (SELECT and UPDATE)
-- Note: recipient_id references profiles.id, NOT auth.users.id
-- So we need to use get_user_profile_id() instead of auth.uid()
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Recreate with correct column references
-- recipient_id is a FK to profiles.id, so we use get_user_profile_id()
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = get_user_profile_id());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (recipient_id = get_user_profile_id())
  WITH CHECK (recipient_id = get_user_profile_id());

-- =============================================================================
-- VERIFICATION COMMENT
-- After applying this migration, all RLS policies should correctly:
--   1. Use get_user_church_id() for church-level isolation
--   2. Use profiles.user_id = auth.uid() for role checks
--   3. Use get_user_profile_id() when comparing to profile ID columns
-- =============================================================================
