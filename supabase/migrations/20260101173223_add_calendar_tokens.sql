-- Create calendar_tokens table for personal calendar subscription authentication
CREATE TABLE calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)  -- One token per user
);

-- Indexes for fast lookups
CREATE INDEX idx_calendar_tokens_token ON calendar_tokens(token);
CREATE INDEX idx_calendar_tokens_profile_id ON calendar_tokens(profile_id);

-- Enable RLS
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own calendar token
CREATE POLICY "Users can view their own calendar token"
  ON calendar_tokens FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert their own calendar token
CREATE POLICY "Users can insert their own calendar token"
  ON calendar_tokens FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can update their own calendar token (regenerate)
CREATE POLICY "Users can update their own calendar token"
  ON calendar_tokens FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can delete their own calendar token
CREATE POLICY "Users can delete their own calendar token"
  ON calendar_tokens FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Updated_at trigger (reuse existing function if available)
CREATE TRIGGER update_calendar_tokens_updated_at
  BEFORE UPDATE ON calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
