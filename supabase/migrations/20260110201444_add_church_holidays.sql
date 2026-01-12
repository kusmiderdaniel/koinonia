-- Create church_holidays table for recurring and one-time church holidays
-- These will be displayed on the dashboard calendar

CREATE TABLE church_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- For recurring holidays: store month (1-12) and day (1-31)
  -- For one-time holidays: store the full date
  month INTEGER CHECK (month >= 1 AND month <= 12),
  day INTEGER CHECK (day >= 1 AND day <= 31),
  -- If specific_date is set, it's a one-time holiday for that year
  -- If NULL, it's a recurring annual holiday using month/day
  specific_date DATE,
  -- Color for display on calendar (optional, defaults to a standard color)
  color TEXT DEFAULT '#f59e0b',
  -- Whether this is a default/seeded holiday or custom
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure either specific_date OR (month AND day) is set
  CONSTRAINT holiday_date_check CHECK (
    (specific_date IS NOT NULL) OR (month IS NOT NULL AND day IS NOT NULL)
  )
);

-- Create index for efficient queries
CREATE INDEX idx_church_holidays_church_id ON church_holidays(church_id);
CREATE INDEX idx_church_holidays_month_day ON church_holidays(month, day) WHERE specific_date IS NULL;
CREATE INDEX idx_church_holidays_specific_date ON church_holidays(specific_date) WHERE specific_date IS NOT NULL;

-- Enable RLS
ALTER TABLE church_holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant isolation
CREATE POLICY "Users can view holidays from their church"
  ON church_holidays FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert holidays for their church"
  ON church_holidays FOR INSERT
  WITH CHECK (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update holidays from their church"
  ON church_holidays FOR UPDATE
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete holidays from their church"
  ON church_holidays FOR DELETE
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_church_holidays_updated_at
  BEFORE UPDATE ON church_holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed common Christian holidays as defaults for new churches
-- Note: These are examples - churches can add/remove their own
COMMENT ON TABLE church_holidays IS 'Church holidays displayed on the dashboard calendar. Can be recurring (annual) or one-time.';
