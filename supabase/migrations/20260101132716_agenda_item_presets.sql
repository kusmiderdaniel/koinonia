-- Create agenda_item_presets table for reusable agenda items
CREATE TABLE agenda_item_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_agenda_item_presets_church_id ON agenda_item_presets(church_id);
CREATE INDEX idx_agenda_item_presets_ministry_id ON agenda_item_presets(ministry_id);

-- Enable RLS
ALTER TABLE agenda_item_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view presets from their church"
  ON agenda_item_presets FOR SELECT
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert presets for their church"
  ON agenda_item_presets FOR INSERT
  WITH CHECK (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update presets from their church"
  ON agenda_item_presets FOR UPDATE
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete presets from their church"
  ON agenda_item_presets FOR DELETE
  USING (church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_agenda_item_presets_updated_at
  BEFORE UPDATE ON agenda_item_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
