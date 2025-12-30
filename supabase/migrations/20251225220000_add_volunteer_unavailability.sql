-- Migration: Add volunteer unavailability table
-- Allows volunteers to mark dates/date ranges when they are unavailable

-- Create volunteer_unavailability table
CREATE TABLE volunteer_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure end_date is not before start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for common queries
CREATE INDEX idx_volunteer_unavailability_profile ON volunteer_unavailability(profile_id);
CREATE INDEX idx_volunteer_unavailability_church ON volunteer_unavailability(church_id);
CREATE INDEX idx_volunteer_unavailability_dates ON volunteer_unavailability(start_date, end_date);

-- Enable RLS
ALTER TABLE volunteer_unavailability ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- 1. Users can view their own unavailability
-- 2. Leaders and admins can view all unavailability in their church
-- 3. Users can only manage (insert/update/delete) their own unavailability

-- SELECT policy: Users see own, leaders+ see all in church
CREATE POLICY "Users can view own unavailability, leaders see all"
  ON volunteer_unavailability FOR SELECT
  USING (
    church_id = get_user_church_id() AND (
      profile_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND church_id = get_user_church_id()
        AND role IN ('admin', 'leader')
      )
    )
  );

-- INSERT policy: Users can only add their own unavailability
CREATE POLICY "Users can insert own unavailability"
  ON volunteer_unavailability FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id() AND
    profile_id = auth.uid()
  );

-- UPDATE policy: Users can only update their own unavailability
CREATE POLICY "Users can update own unavailability"
  ON volunteer_unavailability FOR UPDATE
  USING (
    church_id = get_user_church_id() AND
    profile_id = auth.uid()
  )
  WITH CHECK (
    church_id = get_user_church_id() AND
    profile_id = auth.uid()
  );

-- DELETE policy: Users can only delete their own unavailability
CREATE POLICY "Users can delete own unavailability"
  ON volunteer_unavailability FOR DELETE
  USING (
    church_id = get_user_church_id() AND
    profile_id = auth.uid()
  );
