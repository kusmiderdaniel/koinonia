-- Form Analytics: Track form views, starts, and interactions for analytics dashboard
-- Privacy-first: Only anonymous session IDs, no IP address storage

-- ============================================================================
-- 1. FORM ANALYTICS EVENTS TABLE
-- ============================================================================
CREATE TABLE form_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'submit')),
  session_id TEXT NOT NULL, -- Anonymous browser session identifier
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES FOR EFFICIENT AGGREGATION
-- ============================================================================
CREATE INDEX idx_form_analytics_form_id ON form_analytics_events(form_id);
CREATE INDEX idx_form_analytics_created_at ON form_analytics_events(created_at);
CREATE INDEX idx_form_analytics_form_event ON form_analytics_events(form_id, event_type);
CREATE INDEX idx_form_analytics_form_date ON form_analytics_events(form_id, created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE form_analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can record analytics events (needed for public forms)
CREATE POLICY "Anyone can record analytics events"
  ON form_analytics_events FOR INSERT
  WITH CHECK (true);

-- Leaders+ can view analytics for their church's forms
CREATE POLICY "Leaders can view analytics for their church forms"
  ON form_analytics_events FOR SELECT
  USING (
    form_id IN (
      SELECT f.id FROM forms f
      WHERE f.church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can delete analytics events (for cleanup)
CREATE POLICY "Leaders can delete analytics events"
  ON form_analytics_events FOR DELETE
  USING (
    form_id IN (
      SELECT f.id FROM forms f
      WHERE f.church_id = get_user_church_id()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );
