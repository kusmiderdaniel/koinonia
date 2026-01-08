-- Link Tree feature: Public link page for churches with customizable styling and access control
-- Supports both public and role-restricted links

-- ============================================================================
-- 1. LINK TREE SETTINGS TABLE - One per church
-- ============================================================================
CREATE TABLE link_tree_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE UNIQUE,

  -- Basic info
  title TEXT,
  bio TEXT,

  -- Theming
  background_color TEXT DEFAULT '#FFFFFF',
  background_gradient_start TEXT,
  background_gradient_end TEXT,
  card_style TEXT DEFAULT 'filled' CHECK (card_style IN ('filled', 'outline', 'shadow')),
  card_border_radius TEXT DEFAULT 'rounded-lg' CHECK (card_border_radius IN ('rounded-none', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full')),

  -- Logo/Avatar
  avatar_url TEXT,
  show_church_name BOOLEAN DEFAULT true,

  -- Social links (JSONB for flexibility)
  -- Format: [{"platform": "instagram", "url": "https://..."}, ...]
  social_links JSONB DEFAULT '[]',

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. LINK TREE LINKS TABLE - Individual links with access control
-- ============================================================================
CREATE TABLE link_tree_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,

  -- Styling
  icon TEXT, -- Lucide icon name
  card_color TEXT DEFAULT '#FFFFFF',
  text_color TEXT, -- Auto-calculated if null
  hover_effect TEXT DEFAULT 'scale' CHECK (hover_effect IN ('none', 'scale', 'glow', 'lift')),

  -- Access control: who can see this link
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'member', 'volunteer', 'leader', 'admin')),

  -- State
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- Scheduling (optional)
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- 3. LINK TREE CLICKS TABLE - Analytics
-- ============================================================================
CREATE TABLE link_tree_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES link_tree_links(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE, -- Denormalized for faster queries

  -- Click metadata
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================
CREATE INDEX idx_link_tree_settings_church_id ON link_tree_settings(church_id);
CREATE INDEX idx_link_tree_links_church_id ON link_tree_links(church_id);
CREATE INDEX idx_link_tree_links_sort_order ON link_tree_links(church_id, sort_order);
CREATE INDEX idx_link_tree_links_active ON link_tree_links(church_id, is_active) WHERE is_active = true;
CREATE INDEX idx_link_tree_links_visibility ON link_tree_links(church_id, visibility);
CREATE INDEX idx_link_tree_clicks_link_id ON link_tree_clicks(link_id);
CREATE INDEX idx_link_tree_clicks_church_id ON link_tree_clicks(church_id);
CREATE INDEX idx_link_tree_clicks_date ON link_tree_clicks(clicked_at);
CREATE INDEX idx_link_tree_clicks_analytics ON link_tree_clicks(church_id, clicked_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE link_tree_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tree_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tree_clicks ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- LINK TREE SETTINGS POLICIES
-- ----------------------------------------------------------------------------

-- Church members can view link tree settings
CREATE POLICY "Church members can view link tree settings"
  ON link_tree_settings FOR SELECT
  USING (church_id = get_user_church_id());

-- Leaders+ can insert link tree settings
CREATE POLICY "Leaders can insert link tree settings"
  ON link_tree_settings FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can update link tree settings
CREATE POLICY "Leaders can update link tree settings"
  ON link_tree_settings FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  )
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can delete link tree settings
CREATE POLICY "Leaders can delete link tree settings"
  ON link_tree_settings FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- ----------------------------------------------------------------------------
-- LINK TREE LINKS POLICIES
-- ----------------------------------------------------------------------------

-- Church members can view link tree links
CREATE POLICY "Church members can view link tree links"
  ON link_tree_links FOR SELECT
  USING (church_id = get_user_church_id());

-- Leaders+ can insert link tree links
CREATE POLICY "Leaders can insert link tree links"
  ON link_tree_links FOR INSERT
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can update link tree links
CREATE POLICY "Leaders can update link tree links"
  ON link_tree_links FOR UPDATE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  )
  WITH CHECK (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- Leaders+ can delete link tree links
CREATE POLICY "Leaders can delete link tree links"
  ON link_tree_links FOR DELETE
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- ----------------------------------------------------------------------------
-- LINK TREE CLICKS POLICIES
-- ----------------------------------------------------------------------------

-- Leaders+ can view click analytics
CREATE POLICY "Leaders can view click analytics"
  ON link_tree_clicks FOR SELECT
  USING (
    church_id = get_user_church_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'leader')
    )
  );

-- NOTE: INSERT for clicks is done via service role client (public endpoint)
-- to allow anonymous users to trigger click tracking

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================================
CREATE TRIGGER update_link_tree_settings_updated_at
  BEFORE UPDATE ON link_tree_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_tree_links_updated_at
  BEFORE UPDATE ON link_tree_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
