-- =====================================================
-- Google Calendar Integration Tables
-- Migration: 20260116140000_add_google_calendar_integration.sql
-- =====================================================

-- 1. Main connections table - stores OAuth tokens and calendar IDs
CREATE TABLE google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Google account info
  google_email TEXT NOT NULL,
  google_user_id TEXT,

  -- OAuth tokens (ENCRYPTED with AES-256-GCM)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Created calendar IDs in user's Google account
  church_calendar_google_id TEXT,
  personal_calendar_google_id TEXT,

  -- Sync preferences
  sync_church_calendar BOOLEAN DEFAULT true,
  sync_personal_calendar BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  requires_reauth BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One connection per user
  UNIQUE(profile_id)
);

-- 2. Campus calendars - many-to-many between connections and campuses
CREATE TABLE google_calendar_campus_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,

  -- Google Calendar ID for this campus calendar
  google_calendar_id TEXT NOT NULL,

  -- Whether sync is enabled for this campus
  sync_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One calendar per campus per connection
  UNIQUE(connection_id, campus_id)
);

-- 3. Synced events - tracks which Koinonia events are synced to which Google calendars
CREATE TABLE google_calendar_synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source in Koinonia
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Target in Google Calendar
  connection_id UUID NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('church', 'campus', 'personal')),
  campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,

  -- Google Calendar identifiers
  google_calendar_id TEXT NOT NULL,
  google_event_id TEXT NOT NULL,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  event_hash TEXT, -- MD5 hash of event data for change detection

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index for synced events (handles nullable campus_id)
CREATE UNIQUE INDEX idx_gc_synced_unique
  ON google_calendar_synced_events(event_id, connection_id, calendar_type, COALESCE(campus_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Connections indexes
CREATE INDEX idx_gc_conn_profile ON google_calendar_connections(profile_id);
CREATE INDEX idx_gc_conn_church ON google_calendar_connections(church_id);
CREATE INDEX idx_gc_conn_active ON google_calendar_connections(is_active) WHERE is_active = true;
CREATE INDEX idx_gc_conn_requires_reauth ON google_calendar_connections(requires_reauth) WHERE requires_reauth = true;

-- Campus calendars indexes
CREATE INDEX idx_gc_campus_cal_connection ON google_calendar_campus_calendars(connection_id);
CREATE INDEX idx_gc_campus_cal_campus ON google_calendar_campus_calendars(campus_id);

-- Synced events indexes
CREATE INDEX idx_gc_synced_event ON google_calendar_synced_events(event_id);
CREATE INDEX idx_gc_synced_connection ON google_calendar_synced_events(connection_id);
CREATE INDEX idx_gc_synced_google_event ON google_calendar_synced_events(google_event_id);
CREATE INDEX idx_gc_synced_calendar_type ON google_calendar_synced_events(calendar_type);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_campus_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_synced_events ENABLE ROW LEVEL SECURITY;

-- Connections: users can only manage their own
CREATE POLICY "Users can view own gc connection"
  ON google_calendar_connections FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own gc connection"
  ON google_calendar_connections FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own gc connection"
  ON google_calendar_connections FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own gc connection"
  ON google_calendar_connections FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Campus calendars: via connection ownership
CREATE POLICY "Users can view own campus calendars"
  ON google_calendar_campus_calendars FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own campus calendars"
  ON google_calendar_campus_calendars FOR INSERT
  WITH CHECK (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own campus calendars"
  ON google_calendar_campus_calendars FOR UPDATE
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own campus calendars"
  ON google_calendar_campus_calendars FOR DELETE
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Synced events: via connection ownership
CREATE POLICY "Users can view own synced events"
  ON google_calendar_synced_events FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own synced events"
  ON google_calendar_synced_events FOR INSERT
  WITH CHECK (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own synced events"
  ON google_calendar_synced_events FOR UPDATE
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own synced events"
  ON google_calendar_synced_events FOR DELETE
  USING (
    connection_id IN (
      SELECT id FROM google_calendar_connections
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- Updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_gc_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gc_connection_updated_at
  BEFORE UPDATE ON google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_gc_connection_updated_at();

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE google_calendar_connections IS 'Stores Google Calendar OAuth connections for users. Tokens are encrypted with AES-256-GCM.';
COMMENT ON TABLE google_calendar_campus_calendars IS 'Tracks which campus calendars are synced for each user connection.';
COMMENT ON TABLE google_calendar_synced_events IS 'Maps Koinonia events to Google Calendar events for sync tracking.';

COMMENT ON COLUMN google_calendar_connections.access_token_encrypted IS 'OAuth access token encrypted with AES-256-GCM. Format: iv:authTag:ciphertext';
COMMENT ON COLUMN google_calendar_connections.refresh_token_encrypted IS 'OAuth refresh token encrypted with AES-256-GCM. Format: iv:authTag:ciphertext';
COMMENT ON COLUMN google_calendar_connections.requires_reauth IS 'Set to true when refresh token is invalid and user needs to re-authorize';
COMMENT ON COLUMN google_calendar_synced_events.event_hash IS 'MD5 hash of event data for change detection during sync';
