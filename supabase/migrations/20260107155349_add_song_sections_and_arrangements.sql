-- ============================================
-- Song Sections and Arrangements Feature
-- ============================================
-- Tables: song_sections, song_arrangements, song_arrangement_sections
-- Updates: event_agenda_items (add arrangement_id)
-- ============================================

-- ============================================
-- STEP 1: CREATE TABLES
-- ============================================

-- Song sections table (stores lyrics by section)
CREATE TABLE song_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'VERSE', 'CHORUS', 'PRE_CHORUS', 'BRIDGE', 'TAG',
    'INTRO', 'OUTRO', 'INTERLUDE', 'ENDING'
  )),
  section_number INTEGER DEFAULT 1,  -- For VERSE 1, VERSE 2, etc.
  label TEXT,                         -- Optional custom label
  lyrics TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Song arrangements table (different orderings of sections)
CREATE TABLE song_arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,  -- True for the "Master" arrangement
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT song_arrangements_unique_name UNIQUE(song_id, name)
);

-- Junction table for arrangement sections (many-to-many with order)
CREATE TABLE song_arrangement_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id UUID NOT NULL REFERENCES song_arrangements(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES song_sections(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- STEP 2: UPDATE EVENT_AGENDA_ITEMS
-- ============================================

-- Add arrangement_id column to event_agenda_items
ALTER TABLE event_agenda_items
ADD COLUMN arrangement_id UUID REFERENCES song_arrangements(id) ON DELETE SET NULL;

COMMENT ON COLUMN event_agenda_items.arrangement_id IS 'The song arrangement to use for this agenda item. If null, uses the default (Master) arrangement.';

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

-- Song sections indexes
CREATE INDEX idx_song_sections_song_id ON song_sections(song_id);
CREATE INDEX idx_song_sections_sort_order ON song_sections(song_id, sort_order);
CREATE INDEX idx_song_sections_type ON song_sections(section_type);

-- Song arrangements indexes
CREATE INDEX idx_song_arrangements_song_id ON song_arrangements(song_id);
CREATE INDEX idx_song_arrangements_is_default ON song_arrangements(song_id, is_default);

-- Song arrangement sections indexes
CREATE INDEX idx_song_arrangement_sections_arrangement_id ON song_arrangement_sections(arrangement_id);
CREATE INDEX idx_song_arrangement_sections_section_id ON song_arrangement_sections(section_id);
CREATE INDEX idx_song_arrangement_sections_sort_order ON song_arrangement_sections(arrangement_id, sort_order);

-- Event agenda items arrangement index
CREATE INDEX idx_event_agenda_items_arrangement_id ON event_agenda_items(arrangement_id);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_arrangement_sections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- ---- SONG SECTIONS POLICIES ----

-- All church members can view sections
CREATE POLICY "Users can view sections for their church songs"
  ON song_sections FOR SELECT
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
  );

-- Leaders+ can create sections
CREATE POLICY "Leaders can create sections"
  ON song_sections FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- Leaders+ can update sections
CREATE POLICY "Leaders can update sections"
  ON song_sections FOR UPDATE
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  )
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- Leaders+ can delete sections
CREATE POLICY "Leaders can delete sections"
  ON song_sections FOR DELETE
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- ---- SONG ARRANGEMENTS POLICIES ----

-- All church members can view arrangements
CREATE POLICY "Users can view arrangements for their church songs"
  ON song_arrangements FOR SELECT
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
  );

-- Leaders+ can create arrangements
CREATE POLICY "Leaders can create arrangements"
  ON song_arrangements FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- Leaders+ can update arrangements
CREATE POLICY "Leaders can update arrangements"
  ON song_arrangements FOR UPDATE
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  )
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- Leaders+ can delete arrangements
CREATE POLICY "Leaders can delete arrangements"
  ON song_arrangements FOR DELETE
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- ---- SONG ARRANGEMENT SECTIONS POLICIES ----

-- All church members can view arrangement sections
CREATE POLICY "Users can view arrangement sections"
  ON song_arrangement_sections FOR SELECT
  USING (
    arrangement_id IN (
      SELECT id FROM song_arrangements WHERE song_id IN (
        SELECT id FROM songs WHERE church_id = get_user_church_id()
      )
    )
  );

-- Leaders+ can create arrangement sections
CREATE POLICY "Leaders can create arrangement sections"
  ON song_arrangement_sections FOR INSERT
  WITH CHECK (
    arrangement_id IN (
      SELECT id FROM song_arrangements WHERE song_id IN (
        SELECT id FROM songs WHERE church_id = get_user_church_id()
      )
    )
    AND is_leader_or_above()
  );

-- Leaders+ can update arrangement sections
CREATE POLICY "Leaders can update arrangement sections"
  ON song_arrangement_sections FOR UPDATE
  USING (
    arrangement_id IN (
      SELECT id FROM song_arrangements WHERE song_id IN (
        SELECT id FROM songs WHERE church_id = get_user_church_id()
      )
    )
    AND is_leader_or_above()
  )
  WITH CHECK (
    arrangement_id IN (
      SELECT id FROM song_arrangements WHERE song_id IN (
        SELECT id FROM songs WHERE church_id = get_user_church_id()
      )
    )
    AND is_leader_or_above()
  );

-- Leaders+ can delete arrangement sections
CREATE POLICY "Leaders can delete arrangement sections"
  ON song_arrangement_sections FOR DELETE
  USING (
    arrangement_id IN (
      SELECT id FROM song_arrangements WHERE song_id IN (
        SELECT id FROM songs WHERE church_id = get_user_church_id()
      )
    )
    AND is_leader_or_above()
  );

-- ============================================
-- STEP 6: CREATE TRIGGERS
-- ============================================

-- Auto-update updated_at for song_sections
CREATE TRIGGER update_song_sections_updated_at
  BEFORE UPDATE ON song_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for song_arrangements
CREATE TRIGGER update_song_arrangements_updated_at
  BEFORE UPDATE ON song_arrangements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
