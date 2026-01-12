-- ============================================================================
-- Performance Indexes Migration
--
-- This migration adds composite indexes to improve query performance for
-- commonly accessed data patterns identified during codebase analysis.
-- ============================================================================

-- =============================================================================
-- EVENTS & SCHEDULING INDEXES
-- =============================================================================

-- Composite index for filtering events by church and date range
-- Used heavily in: dashboard calendar, event listings, upcoming events queries
CREATE INDEX IF NOT EXISTS idx_events_church_start_time
  ON events(church_id, start_time);

-- Composite index for filtering events by church and end time (for range queries)
CREATE INDEX IF NOT EXISTS idx_events_church_end_time
  ON events(church_id, end_time);

-- =============================================================================
-- EVENT POSITIONS & ASSIGNMENTS INDEXES (Matrix Queries)
-- =============================================================================

-- Composite index for matrix queries that filter positions by event and ministry
-- Used heavily in: volunteer matrix, event detail panels, position management
CREATE INDEX IF NOT EXISTS idx_event_positions_event_ministry
  ON event_positions(event_id, ministry_id);

-- Composite index for looking up assignments by position and profile
-- Used in: checking if user is assigned, assignment lookups
CREATE INDEX IF NOT EXISTS idx_event_assignments_position_profile
  ON event_assignments(position_id, profile_id);

-- Index for finding all assignments for an event (via position)
-- Useful for event detail views showing all volunteers
CREATE INDEX IF NOT EXISTS idx_event_positions_event_sort
  ON event_positions(event_id, sort_order);

-- =============================================================================
-- MINISTRY MEMBERS INDEXES
-- =============================================================================

-- Composite index for getting active members of a ministry
-- Used heavily in: member lists, volunteer pickers, ministry detail views
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry_active
  ON ministry_members(ministry_id, is_active)
  WHERE is_active = true;

-- Composite index for finding all ministries a profile belongs to
CREATE INDEX IF NOT EXISTS idx_ministry_members_profile_active
  ON ministry_members(profile_id, is_active)
  WHERE is_active = true;

-- =============================================================================
-- PROFILE CAMPUSES INDEXES
-- =============================================================================

-- Index for finding primary campus assignments efficiently
CREATE INDEX IF NOT EXISTS idx_profile_campuses_profile_primary
  ON profile_campuses(profile_id, is_primary)
  WHERE is_primary = true;

-- =============================================================================
-- NOTIFICATIONS INDEXES
-- =============================================================================

-- Composite index for fetching unread notifications efficiently
-- Used heavily in: notification center, inbox page
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications(recipient_id, created_at DESC)
  WHERE is_read = false;

-- =============================================================================
-- FORMS & SUBMISSIONS INDEXES
-- =============================================================================

-- Index for form submissions by date (for analytics/reporting)
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_date
  ON form_submissions(form_id, submitted_at DESC);

-- =============================================================================
-- TASKS INDEXES
-- =============================================================================

-- Composite index for filtering tasks assigned to a user by status
-- Used in: dashboard tasks widget, my tasks page
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status
  ON tasks(assigned_to, status)
  WHERE status IN ('pending', 'in_progress');

-- =============================================================================
-- VOLUNTEER UNAVAILABILITY INDEXES
-- =============================================================================

-- Composite index for checking unavailability across date ranges
-- Used in: volunteer picker, availability checks
CREATE INDEX IF NOT EXISTS idx_volunteer_unavailability_dates_profile
  ON volunteer_unavailability(profile_id, start_date, end_date);

-- ============================================================================
-- ANALYSIS NOTES:
--
-- These indexes were identified by analyzing query patterns in:
-- - app/dashboard/events/actions/matrix-queries.ts
-- - app/dashboard/actions.ts
-- - app/dashboard/people/page.tsx
-- - app/dashboard/ministries/actions/queries.ts
-- - Various server actions that filter by church_id + date ranges
--
-- Composite indexes are more efficient than single-column indexes when
-- queries filter on multiple columns, as the database can use the index
-- to satisfy the entire WHERE clause.
-- ============================================================================
