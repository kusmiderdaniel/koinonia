-- ============================================================================
-- Event Templates System
-- Allows churches to create reusable event blueprints with agenda items and positions
-- ============================================================================

-- ============================================================================
-- TABLE: event_templates
-- Main template metadata (name, event type, default times, etc.)
-- ============================================================================
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('service', 'rehearsal', 'meeting', 'special_event', 'other')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  default_start_time TIME NOT NULL,
  default_duration_minutes INTEGER NOT NULL DEFAULT 120,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('members', 'volunteers', 'leaders', 'hidden')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(church_id, name)
);

-- Indexes for event_templates
CREATE INDEX idx_event_templates_church_id ON event_templates(church_id);
CREATE INDEX idx_event_templates_event_type ON event_templates(event_type);
CREATE INDEX idx_event_templates_is_active ON event_templates(is_active);
CREATE INDEX idx_event_templates_created_by ON event_templates(created_by);

-- ============================================================================
-- TABLE: event_template_agenda_items
-- Agenda items within a template (with song placeholder support)
-- ============================================================================
CREATE TABLE event_template_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 300 CHECK (duration_seconds > 0),
  is_song_placeholder BOOLEAN DEFAULT false,
  ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_template_agenda_items
CREATE INDEX idx_event_template_agenda_items_template_id ON event_template_agenda_items(template_id);
CREATE INDEX idx_event_template_agenda_items_sort ON event_template_agenda_items(template_id, sort_order);
CREATE INDEX idx_event_template_agenda_items_ministry_id ON event_template_agenda_items(ministry_id);

-- ============================================================================
-- TABLE: event_template_positions
-- Volunteer positions within a template (without assignments)
-- ============================================================================
CREATE TABLE event_template_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES event_templates(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  role_id UUID REFERENCES ministry_roles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  quantity_needed INTEGER NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_template_positions
CREATE INDEX idx_event_template_positions_template_id ON event_template_positions(template_id);
CREATE INDEX idx_event_template_positions_ministry_id ON event_template_positions(ministry_id);
CREATE INDEX idx_event_template_positions_role_id ON event_template_positions(role_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_template_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_template_positions ENABLE ROW LEVEL SECURITY;

-- event_templates policies
CREATE POLICY "Users can view templates in their church"
  ON event_templates FOR SELECT
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Leaders can create templates"
  ON event_templates FOR INSERT
  WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  );

CREATE POLICY "Leaders can update templates"
  ON event_templates FOR UPDATE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  )
  WITH CHECK (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  );

CREATE POLICY "Admins can delete templates"
  ON event_templates FOR DELETE
  USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin')
  );

-- event_template_agenda_items policies
CREATE POLICY "Users can view template agenda items in their church"
  ON event_template_agenda_items FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Leaders can manage template agenda items"
  ON event_template_agenda_items FOR ALL
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  );

-- event_template_positions policies
CREATE POLICY "Users can view template positions in their church"
  ON event_template_positions FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Leaders can manage template positions"
  ON event_template_positions FOR ALL
  USING (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM event_templates WHERE church_id = (
        SELECT church_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'leader')
  );

-- ============================================================================
-- TRIGGERS for updated_at
-- ============================================================================

CREATE TRIGGER update_event_templates_updated_at
  BEFORE UPDATE ON event_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_template_agenda_items_updated_at
  BEFORE UPDATE ON event_template_agenda_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_template_positions_updated_at
  BEFORE UPDATE ON event_template_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
