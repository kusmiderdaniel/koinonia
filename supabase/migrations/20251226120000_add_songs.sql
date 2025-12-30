-- ============================================
-- Songs Library Feature
-- ============================================
-- Tables: songs, song_tags, song_tag_assignments, song_attachments
-- Storage: song-attachments bucket for PDF files
-- ============================================

-- ============================================
-- STEP 1: CREATE ALL TABLES
-- ============================================

-- Songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  default_key TEXT,
  duration_seconds INTEGER,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Song tags (church-specific)
CREATE TABLE song_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT song_tags_unique_name_per_church UNIQUE(church_id, name)
);

-- Song tag assignments (many-to-many)
CREATE TABLE song_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES song_tags(id) ON DELETE CASCADE,
  CONSTRAINT song_tag_assignments_unique UNIQUE(song_id, tag_id)
);

-- Song attachments (PDF files)
CREATE TABLE song_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- STEP 2: CREATE INDEXES
-- ============================================

-- Songs indexes
CREATE INDEX idx_songs_church_id ON songs(church_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_created_at ON songs(created_at);

-- Song tags indexes
CREATE INDEX idx_song_tags_church_id ON song_tags(church_id);
CREATE INDEX idx_song_tags_name ON song_tags(name);

-- Song tag assignments indexes
CREATE INDEX idx_song_tag_assignments_song_id ON song_tag_assignments(song_id);
CREATE INDEX idx_song_tag_assignments_tag_id ON song_tag_assignments(tag_id);

-- Song attachments indexes
CREATE INDEX idx_song_attachments_song_id ON song_attachments(song_id);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- Helper function to check if user is leader or above
CREATE OR REPLACE FUNCTION is_leader_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin', 'leader')
  )
$$;

-- ---- SONGS POLICIES ----

-- All church members can view songs
CREATE POLICY "Users can view songs from their church"
  ON songs FOR SELECT
  USING (church_id = get_user_church_id());

-- Leaders+ can create songs
CREATE POLICY "Leaders can create songs"
  ON songs FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND is_leader_or_above()
  );

-- Leaders+ can update songs
CREATE POLICY "Leaders can update songs"
  ON songs FOR UPDATE
  USING (church_id = get_user_church_id() AND is_leader_or_above())
  WITH CHECK (church_id = get_user_church_id() AND is_leader_or_above());

-- Leaders+ can delete songs
CREATE POLICY "Leaders can delete songs"
  ON songs FOR DELETE
  USING (church_id = get_user_church_id() AND is_leader_or_above());

-- ---- SONG TAGS POLICIES ----

-- All church members can view tags
CREATE POLICY "Users can view tags from their church"
  ON song_tags FOR SELECT
  USING (church_id = get_user_church_id());

-- Leaders+ can create tags
CREATE POLICY "Leaders can create tags"
  ON song_tags FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND is_leader_or_above()
  );

-- Leaders+ can update tags
CREATE POLICY "Leaders can update tags"
  ON song_tags FOR UPDATE
  USING (church_id = get_user_church_id() AND is_leader_or_above())
  WITH CHECK (church_id = get_user_church_id() AND is_leader_or_above());

-- Leaders+ can delete tags
CREATE POLICY "Leaders can delete tags"
  ON song_tags FOR DELETE
  USING (church_id = get_user_church_id() AND is_leader_or_above());

-- ---- SONG TAG ASSIGNMENTS POLICIES ----

-- All church members can view tag assignments (via songs)
CREATE POLICY "Users can view tag assignments for their church songs"
  ON song_tag_assignments FOR SELECT
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
  );

-- Leaders+ can create tag assignments
CREATE POLICY "Leaders can assign tags to songs"
  ON song_tag_assignments FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- Leaders+ can delete tag assignments
CREATE POLICY "Leaders can remove tags from songs"
  ON song_tag_assignments FOR DELETE
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- ---- SONG ATTACHMENTS POLICIES ----

-- All church members can view attachments
CREATE POLICY "Users can view attachments for their church songs"
  ON song_attachments FOR SELECT
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
  );

-- Leaders+ can create attachments
CREATE POLICY "Leaders can add attachments"
  ON song_attachments FOR INSERT
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- Leaders+ can delete attachments
CREATE POLICY "Leaders can delete attachments"
  ON song_attachments FOR DELETE
  USING (
    song_id IN (
      SELECT id FROM songs WHERE church_id = get_user_church_id()
    )
    AND is_leader_or_above()
  );

-- ============================================
-- STEP 5: CREATE TRIGGERS
-- ============================================

-- Auto-update updated_at for songs
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 6: SETUP STORAGE BUCKET
-- ============================================

-- Create the storage bucket for song attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-attachments',
  'song-attachments',
  false,
  10485760,  -- 10MB limit
  ARRAY['application/pdf']
);

-- Storage policies for song attachments

-- All authenticated users from the same church can view attachments
CREATE POLICY "Users can view song attachments from their church"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'song-attachments'
    AND auth.role() = 'authenticated'
  );

-- Leaders+ can upload attachments
CREATE POLICY "Leaders can upload song attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'song-attachments'
    AND auth.role() = 'authenticated'
    AND is_leader_or_above()
  );

-- Leaders+ can delete attachments
CREATE POLICY "Leaders can delete song attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'song-attachments'
    AND auth.role() = 'authenticated'
    AND is_leader_or_above()
  );
