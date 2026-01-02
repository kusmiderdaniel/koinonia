-- Migration: RLS policies for campus tables
-- Implements campus-based data isolation with admin bypass

-- ============================================================================
-- ENABLE RLS ON NEW TABLES
-- ============================================================================

ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_campuses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CAMPUSES TABLE POLICIES
-- ============================================================================

-- All church members can view campuses
CREATE POLICY "Users can view campuses in their church"
  ON campuses FOR SELECT
  USING (church_id = get_user_church_id());

-- Only admins/owners can create campuses
CREATE POLICY "Admins can create campuses"
  ON campuses FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND is_admin_or_owner()
  );

-- Only admins/owners can update campuses
CREATE POLICY "Admins can update campuses"
  ON campuses FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND is_admin_or_owner()
  );

-- Only admins/owners can delete campuses
CREATE POLICY "Admins can delete campuses"
  ON campuses FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND is_admin_or_owner()
  );

-- ============================================================================
-- PROFILE_CAMPUSES TABLE POLICIES
-- ============================================================================

-- Users can view their own campus assignments, admins can view all
CREATE POLICY "Users can view profile campus assignments"
  ON profile_campuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_campuses.profile_id
      AND p.church_id = get_user_church_id()
    )
  );

-- Admins can create campus assignments
CREATE POLICY "Admins can create profile campus assignments"
  ON profile_campuses FOR INSERT
  WITH CHECK (
    is_admin_or_owner()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_campuses.profile_id
      AND p.church_id = get_user_church_id()
    )
  );

-- Admins can update campus assignments
CREATE POLICY "Admins can update profile campus assignments"
  ON profile_campuses FOR UPDATE
  USING (
    is_admin_or_owner()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_campuses.profile_id
      AND p.church_id = get_user_church_id()
    )
  );

-- Admins can delete campus assignments
CREATE POLICY "Admins can delete profile campus assignments"
  ON profile_campuses FOR DELETE
  USING (
    is_admin_or_owner()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_campuses.profile_id
      AND p.church_id = get_user_church_id()
    )
  );

-- ============================================================================
-- EVENT_CAMPUSES TABLE POLICIES
-- ============================================================================

-- Users can view event campus assignments for events they can access
CREATE POLICY "Users can view event campus assignments"
  ON event_campuses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_campuses.event_id
      AND e.church_id = get_user_church_id()
    )
  );

-- Admins/leaders can create event campus assignments
CREATE POLICY "Admins can create event campus assignments"
  ON event_campuses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_campuses.event_id
      AND e.church_id = get_user_church_id()
    )
  );

-- Admins/leaders can update event campus assignments
CREATE POLICY "Admins can update event campus assignments"
  ON event_campuses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_campuses.event_id
      AND e.church_id = get_user_church_id()
    )
  );

-- Admins/leaders can delete event campus assignments
CREATE POLICY "Admins can delete event campus assignments"
  ON event_campuses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_campuses.event_id
      AND e.church_id = get_user_church_id()
    )
  );

-- ============================================================================
-- UPDATE EXISTING TABLE POLICIES FOR CAMPUS FILTERING
-- ============================================================================

-- Note: We will add campus filtering to events, ministries, and templates
-- through application-level queries rather than modifying existing RLS policies.
-- This approach allows for smoother backwards compatibility and the admin bypass
-- is handled through the helper functions we created.

-- The helper functions (user_has_event_campus_access, user_has_ministry_campus_access,
-- user_has_template_campus_access) should be called in application queries to filter
-- data appropriately while allowing admin bypass.
