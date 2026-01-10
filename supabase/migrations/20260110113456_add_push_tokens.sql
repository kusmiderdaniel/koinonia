-- Create push_tokens table for FCM token storage
-- Follows the calendar_tokens pattern for multi-tenant token storage

CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- FCM token (can be long)
  token TEXT NOT NULL,

  -- Device identification for managing multiple devices
  device_id TEXT NOT NULL,
  device_name TEXT,
  platform TEXT CHECK (platform IN ('web', 'ios', 'android')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Ensure one token per device per user
  UNIQUE(profile_id, device_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE INDEX idx_push_tokens_profile_id ON push_tokens(profile_id);
CREATE INDEX idx_push_tokens_church_id ON push_tokens(church_id);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own push tokens
CREATE POLICY "Users can view their own push tokens"
  ON push_tokens FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert their own push tokens
CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update their own push tokens
CREATE POLICY "Users can update their own push tokens"
  ON push_tokens FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete their own push tokens
CREATE POLICY "Users can delete their own push tokens"
  ON push_tokens FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
